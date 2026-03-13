import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
export const expect = chai.expect;

import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

function getHandle(enc: any, i = 0) {
  const h = enc?.handles?.[i];
  if (!h) throw new Error(`Encrypted input missing handles[${i}]`);
  return h;
}

function getProof(enc: any) {
  const p = enc?.inputProof ?? enc?.proof; // compat
  if (!p) throw new Error("Encrypted input missing inputProof/proof");
  return p;
}

function makeBytes32(label: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(label));
}

async function mintUnderlying(
  underlying: any,
  signer: any,
  to: string,
  amount: number
) {
  const tx = await underlying.connect(signer).mint(to, amount);
  await tx.wait();
}

async function wrapUnderlyingForEmployer(
  wrapper: any,
  underlying: any,
  employer: any,
  amount: number
) {
  await (await underlying.connect(employer).approve(await wrapper.getAddress(), amount)).wait();
  await (await wrapper.connect(employer).wrap(employer.address, amount)).wait();
}

async function setEncryptedSalary(
  payrollAddr: string,
  payroll: any,
  employer: any,
  employeeAddr: string,
  amount: number
) {
  const enc = await fhevm
    .createEncryptedInput(payrollAddr, employer.address)
    .add64(amount)
    .encrypt();

  const tx = await payroll.connect(employer).setSalary(employeeAddr, getHandle(enc), getProof(enc));
  await tx.wait();
}

async function deployStack() {
  const [platformAdmin] = await ethers.getSigners();

  // 1) Deploy underlying ERC20 (mock)
  const Underlying = await ethers.getContractFactory("MockERC20", platformAdmin);
  const underlying = await Underlying.deploy("Mock USD", "mUSD", 6);
  await underlying.waitForDeployment();
  const underlyingAddr = await underlying.getAddress();

  // 2) Deploy confidential wrapper (ERC7984)
  const Wrapper = await ethers.getContractFactory("PayrollConfidentialWrapper", platformAdmin);
  const wrapper = await Wrapper.deploy(
    underlyingAddr,
    "Confidential Payroll USD",
    "cpUSD",
    "ipfs://payroll-conf-wrapper"
  );
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();

  // 3) Deploy minimal registry/factory
  const Registry = await ethers.getContractFactory("PayrollFactoryRegistry", platformAdmin);
  const registry = await Registry.deploy(wrapperAddr);
  await registry.waitForDeployment();

  return { underlying, wrapper, wrapperAddr, registry };
}

describe("Confidential Payroll Platform (minimal Registry + Payroll + ERC-7984)", () => {
  it("registers a company via registry (opaque companyRef), deploys Payroll, and supports basic employee lifecycle without registry hooks", async () => {
    const [platformAdmin, employer, employee, attacker] = await ethers.getSigners();
    const { wrapper, registry } = await deployStack();

    // 1) Employer registers company with opaque bytes32 ref (no company name onchain)
    const companyRef = makeBytes32("company:acme-labs");

    await (await registry.connect(employer).registerCompany(companyRef)).wait();

    // Self lookup works
    const payrollAddrFromSelf = await registry.connect(employer).myCompany();
    expect(payrollAddrFromSelf).to.not.equal(ethers.ZeroAddress);

    // Restricted lookup works only for same caller == employer_
    const payrollAddr = await registry.connect(employer).companyOfEmployer(employer.address);
    expect(payrollAddr).to.equal(payrollAddrFromSelf);

    await expect(
      registry.connect(attacker).companyOfEmployer(employer.address)
    ).to.be.rejected;

    // Registry only exposes minimal info
    expect(await registry.isRegisteredPayroll(payrollAddr)).to.equal(true);
    expect(await registry.companyRefOfPayroll(payrollAddr)).to.equal(companyRef);

    // 2) Attach Payroll instance
    const payroll = await ethers.getContractAt("Payroll", payrollAddr, employer);

    // 3) Payroll metadata sanity checks (no companyName, no registry hooks)
    expect(await payroll.employer()).to.equal(employer.address);
    expect(await payroll.companyRef()).to.equal(companyRef);

    // Depending on ABI generation, `token()` or `payrollToken()` may both exist.
    // Use payrollToken() helper to avoid interface return decoding issues in some setups.
    expect(await payroll.payrollToken()).to.equal(await wrapper.getAddress());

    // 4) Employee lifecycle (no public roster enumeration)
    await (await payroll.connect(employer).addEmployee(employee.address)).wait();

    // Employer-only current status view
    expect(await payroll.connect(employer).isEmployee(employee.address)).to.equal(true);

    // Employee self-check
    expect(await payroll.connect(employee).myEmploymentActive()).to.equal(true);

    // Non-employer cannot inspect employer-only view
    await expect(payroll.connect(attacker).isEmployee(employee.address)).to.be.rejected;

    // Remove employee
    await (await payroll.connect(employer).removeEmployee(employee.address)).wait();

    expect(await payroll.connect(employer).isEmployee(employee.address)).to.equal(false);
    expect(await payroll.connect(employee).myEmploymentActive()).to.equal(false);
  });

  it("sets encrypted salary, enforces restricted reads, runs runId-locked payroll, and stores last payment + last runId", async () => {
    const [platformAdmin, employer, employee, attacker] = await ethers.getSigners();
    const { underlying, wrapper, wrapperAddr, registry } = await deployStack();

    // Create company payroll
    const companyRef = makeBytes32("company:conficorp");
    await (await registry.connect(employer).registerCompany(companyRef)).wait();
    const payrollAddr = await registry.connect(employer).myCompany();
    const payroll = await ethers.getContractAt("Payroll", payrollAddr, employer);

    // Fund employer (100_000)
    await mintUnderlying(underlying, platformAdmin, employer.address, 100_000);
    await wrapUnderlyingForEmployer(wrapper, underlying, employer, 100_000);

    // Employer sets payroll contract as operator (required for confidentialTransferFrom)
    {
      const now = Math.floor(Date.now() / 1000);
      await (await wrapper.connect(employer).setOperator(payrollAddr, now + 3600)).wait();
    }

    // Add employee and set encrypted salary = 1_000
    await (await payroll.connect(employer).addEmployee(employee.address)).wait();
    await setEncryptedSalary(payrollAddr, payroll, employer, employee.address, 1_000);

    // ------------------------------------------------------------
    // Restricted salary handle reads
    // ------------------------------------------------------------

    // Employer can read employee salary handle
    const salaryHandleEmployer = await payroll.connect(employer).salaryOfEmployee(employee.address);

    // Employee can self-read salary handle
    const salaryHandleEmployee = await payroll.connect(employee).mySalary();

    // Sanity: same handle bytes
    expect(ethers.hexlify(salaryHandleEmployee)).to.equal(ethers.hexlify(salaryHandleEmployer));

    // Attacker cannot call restricted salary getters
    await expect(payroll.connect(attacker).salaryOfEmployee(employee.address)).to.be.rejected;
    await expect(payroll.connect(attacker).mySalary()).to.be.rejected;

    // Employer and employee can decrypt salary, attacker cannot
    const sEmployer = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(salaryHandleEmployer),
      payrollAddr,
      employer
    );
    expect(sEmployer).to.equal(1_000);

    const sEmployee = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(salaryHandleEmployee),
      payrollAddr,
      employee
    );
    expect(sEmployee).to.equal(1_000);

    await expect(
      fhevm.userDecryptEuint(
        FhevmType.euint64,
        ethers.hexlify(salaryHandleEmployer),
        payrollAddr,
        attacker
      )
    ).to.be.rejected;

    // ------------------------------------------------------------
    // runId-locked payroll execution (opaque bytes32, replaces period)
    // ------------------------------------------------------------

    const run1 = makeBytes32("run:2025-01");
    const run2 = makeBytes32("run:2025-02");

    // Initially, no payment registered for run1
    expect(await payroll.connect(employer).paidInRun(employee.address, run1)).to.equal(false);

    // First payment for run1 should succeed
    await (await payroll.connect(employer).runPayrollForRun(employee.address, run1)).wait();
    expect(await payroll.connect(employer).paidInRun(employee.address, run1)).to.equal(true);

    // Duplicate payment in same run must fail
    await expect(
      payroll.connect(employer).runPayrollForRun(employee.address, run1)
    ).to.be.rejected;

    // New run should succeed
    await (await payroll.connect(employer).runPayrollForRun(employee.address, run2)).wait();
    expect(await payroll.connect(employer).paidInRun(employee.address, run2)).to.equal(true);

    // IMPORTANT regression check:
    // old duplicate bug pattern should remain impossible
    await expect(
      payroll.connect(employer).runPayrollForRun(employee.address, run1)
    ).to.be.rejected;

    // Employee confidential balance should now be 2_000
    const balHandle = await wrapper.confidentialBalanceOf(employee.address);
    const employeeBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(balHandle),
      wrapperAddr,
      employee
    );
    expect(employeeBal).to.equal(2_000);

    // ------------------------------------------------------------
    // Restricted last payment handle + runId views
    // ------------------------------------------------------------

    // Employer can read last payment handle and last runId
    const lastPaymentHandleEmployer = await payroll
      .connect(employer)
      .lastPaymentOfEmployee(employee.address);
    expect(await payroll.connect(employer).lastRunIdOfEmployee(employee.address)).to.equal(run2);

    // Employee can self-read last payment handle and last runId
    const lastPaymentHandleEmployee = await payroll.connect(employee).myLastPayment();
    expect(await payroll.connect(employee).myLastRunId()).to.equal(run2);

    // Attacker cannot read restricted last payment / runId views
    await expect(payroll.connect(attacker).lastPaymentOfEmployee(employee.address)).to.be.rejected;
    await expect(payroll.connect(attacker).myLastPayment()).to.be.rejected;
    await expect(payroll.connect(attacker).lastRunIdOfEmployee(employee.address)).to.be.rejected;
    await expect(payroll.connect(attacker).myLastRunId()).to.be.rejected;

    // Employer and employee can decrypt last payment (should be 1_000), attacker cannot
    const lastPayEmployer = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(lastPaymentHandleEmployer),
      payrollAddr,
      employer
    );
    expect(lastPayEmployer).to.equal(1_000);

    const lastPayEmployee = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(lastPaymentHandleEmployee),
      payrollAddr,
      employee
    );
    expect(lastPayEmployee).to.equal(1_000);

    await expect(
      fhevm.userDecryptEuint(
        FhevmType.euint64,
        ethers.hexlify(lastPaymentHandleEmployer),
        payrollAddr,
        attacker
      )
    ).to.be.rejected;
  });

  it("runs batch payroll for a runId and prevents duplicate batch payments for the same runId", async () => {
    const [platformAdmin, employer, employee1, employee2] = await ethers.getSigners();
    const { underlying, wrapper, wrapperAddr, registry } = await deployStack();

    // Deploy payroll via registry
    const companyRef = makeBytes32("company:batchco");
    await (await registry.connect(employer).registerCompany(companyRef)).wait();
    const payrollAddr = await registry.connect(employer).myCompany();
    const payroll = await ethers.getContractAt("Payroll", payrollAddr, employer);

    // Fund employer
    await mintUnderlying(underlying, platformAdmin, employer.address, 100_000);
    await wrapUnderlyingForEmployer(wrapper, underlying, employer, 100_000);

    // Approve payroll contract as operator
    {
      const now = Math.floor(Date.now() / 1000);
      await (await wrapper.connect(employer).setOperator(payrollAddr, now + 3600)).wait();
    }

    // Add employees
    await (await payroll.connect(employer).addEmployee(employee1.address)).wait();
    await (await payroll.connect(employer).addEmployee(employee2.address)).wait();

    // Set salaries (1000 and 2000)
    await setEncryptedSalary(payrollAddr, payroll, employer, employee1.address, 1_000);
    await setEncryptedSalary(payrollAddr, payroll, employer, employee2.address, 2_000);

    const runId = makeBytes32("run:2025-03");

    // Batch payroll for runId succeeds
    await (
      await payroll
        .connect(employer)
        .runPayrollBatchForRun([employee1.address, employee2.address], runId)
    ).wait();

    // Same runId again should revert (duplicate on first employee encountered)
    await expect(
      payroll.connect(employer).runPayrollBatchForRun([employee1.address, employee2.address], runId)
    ).to.be.rejected;

    // Check run flags
    expect(await payroll.connect(employer).paidInRun(employee1.address, runId)).to.equal(true);
    expect(await payroll.connect(employer).paidInRun(employee2.address, runId)).to.equal(true);

    // Check balances
    const bal1Handle = await wrapper.confidentialBalanceOf(employee1.address);
    const bal2Handle = await wrapper.confidentialBalanceOf(employee2.address);

    const bal1 = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(bal1Handle),
      wrapperAddr,
      employee1
    );
    const bal2 = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(bal2Handle),
      wrapperAddr,
      employee2
    );

    expect(bal1).to.equal(1_000);
    expect(bal2).to.equal(2_000);

    // Check last runId tracked per employee
    expect(await payroll.connect(employer).lastRunIdOfEmployee(employee1.address)).to.equal(runId);
    expect(await payroll.connect(employer).lastRunIdOfEmployee(employee2.address)).to.equal(runId);
  });

  it("allows a delegated EMPLOYER_ROLE operator to execute payroll, but pays from the canonical employer wallet", async () => {
    const [platformAdmin, employer, payrollOperator, employee] = await ethers.getSigners();
    const { underlying, wrapper, wrapperAddr, registry } = await deployStack();

    // Deploy payroll via registry
    const companyRef = makeBytes32("company:opsco");
    await (await registry.connect(employer).registerCompany(companyRef)).wait();
    const payrollAddr = await registry.connect(employer).myCompany();
    const payroll = await ethers.getContractAt("Payroll", payrollAddr, employer);

    // Fund ONLY employer (operator intentionally has no wrapped funds)
    await mintUnderlying(underlying, platformAdmin, employer.address, 100_000);
    await wrapUnderlyingForEmployer(wrapper, underlying, employer, 100_000);

    // Employer approves payroll contract as operator over employer funds
    {
      const now = Math.floor(Date.now() / 1000);
      await (await wrapper.connect(employer).setOperator(payrollAddr, now + 3600)).wait();
    }

    // Add employee and set salary
    await (await payroll.connect(employer).addEmployee(employee.address)).wait();
    await setEncryptedSalary(payrollAddr, payroll, employer, employee.address, 1_500);

    // Grant EMPLOYER_ROLE to delegated payroll operator
    const EMPLOYER_ROLE = await payroll.EMPLOYER_ROLE();
    await (await payroll.connect(employer).grantRole(EMPLOYER_ROLE, payrollOperator.address)).wait();

    // Delegated operator executes payroll successfully (pays from canonical employer wallet)
    const runId = makeBytes32("run:2025-04");
    await (await payroll.connect(payrollOperator).runPayrollForRun(employee.address, runId)).wait();

    // Employee received salary
    const balHandle = await wrapper.confidentialBalanceOf(employee.address);
    const employeeBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(balHandle),
      wrapperAddr,
      employee
    );
    expect(employeeBal).to.equal(1_500);

    // Paid-in-run flag set
    expect(await payroll.connect(employer).paidInRun(employee.address, runId)).to.equal(true);

    // Last payment handle should be decryptable by BOTH canonical employer and delegated operator
    const lastHandle = await payroll.connect(employer).lastPaymentOfEmployee(employee.address);

    const lastByEmployer = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(lastHandle),
      payrollAddr,
      employer
    );
    expect(lastByEmployer).to.equal(1_500);

    const lastByOperator = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      ethers.hexlify(lastHandle),
      payrollAddr,
      payrollOperator
    );
    expect(lastByOperator).to.equal(1_500);
  });
});