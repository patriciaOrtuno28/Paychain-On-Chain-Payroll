"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodePacked, formatUnits, keccak256, parseUnits, type Address } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { getContracts } from "@/lib/contracts";
import { encryptUint64, handleToHex32, userDecryptUint64 } from "@/lib/fhe";
import { buildPayrollPeriod } from "@/lib/payrollPeriod";
import {
  deleteCompanyOffchain,
  getEmployerCompanyBinding,
  getEmployerRoster,
  removeEmployeeFromCompany,
  type EmployerRosterRow,
  type PayrollCadence,
  updateEmployeeOffchain,
} from "@/lib/supabasePayroll";
import type { Locale } from "@/i18n-config";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const RPC_GAS_CAP = 16_700_000n;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;



function nowUtcDatetimeLocal(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function fmtErr(e: unknown) {
  const anyE = e as any;
  const errorName =
    anyE?.cause?.data?.errorName ??
    anyE?.data?.errorName ??
    anyE?.cause?.name ??
    anyE?.name;

  const short =
    anyE?.shortMessage ??
    anyE?.cause?.shortMessage ??
    anyE?.details ??
    anyE?.cause?.details;

  const fallback = (() => {
    if (e instanceof Error) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  })();

  if (errorName && short) return `${short} (${errorName})`;
  return short ?? fallback;
}

interface EmployerContextValue {
  locale: Locale;

  // Platform + company
  registryAddress?: string;
  wrapperAddress?: string;
  underlyingAddr?: Address;
  payrollAddr: Address;
  wrapperRate: string;
  hasCompany: boolean;
  backendSynced: boolean;
  supabaseError: string | null;
  companyName: string;
  canUseFhe: boolean;

  // Funding
  underlyingSymbol: string;
  underlyingDecimalsValue: number;
  underlyingBalanceFormatted: string;
  wrapAmountInput: string;
  setWrapAmountInput: (value: string) => void;
  onApproveWrap: () => Promise<void>;
  onWrap: () => Promise<void>;

  // Confidential treasury
  employerConfidentialBalanceFormatted: string | null;
  onDecryptBalance: () => Promise<void>;

  // Operator
  operatorStatus?: boolean;
  operatorDays: string;
  setOperatorDays: (value: string) => void;
  onSetOperator: () => Promise<void>;

  // Register / company info
  payrollAbi?: any;
  companyOnchainBindingId: string | null;
  onSuccess: () => void;
  onDeleteCompany: () => Promise<void>;
  onExportCsv: () => void;

  // Roster
  rosterRows: EmployerRosterRow[];
  rosterLoading: boolean;
  selectedEmployee: Address | "";
  onSelectEmployee: (addr: Address | "") => void;
  onRemoveEmployee: (row: EmployerRosterRow) => Promise<void>;
  onUpdateEmployeeOffchain: (
    row: EmployerRosterRow,
    updates: {
      job_title?: string | null;
      employment_status?: string;
      start_date?: string;
      end_date?: string | null;
      active?: boolean;
    }
  ) => Promise<void>;
  selectedRow: EmployerRosterRow | null;

  // Payroll run
  computedEmployeePayrollPeriod: { humanLabel: string; id: bigint };
  computedEmployeeRunId: string | null;
  onRunPayrollSingle: () => Promise<void>;
  onRunPayrollBatch: (referenceDateUtc: string) => Promise<void>;
  activeEmployeeCount: number;
  activeCadenceCount: number;

  // Confidential view
  selectedSalaryPlain: bigint | null;
  selectedLastPaymentPlain: bigint | null;
  selectedSalaryFormatted: string | null;
  selectedLastPaymentFormatted: string | null;
  selectedSalaryHandle: string;
  selectedLastPaymentHandle: string;
  selectedLastPaidPeriod: string;
  onDecryptSalary: () => Promise<void>;
  onDecryptLastPayment: () => Promise<void>;
  updateSalaryInput: string;
  setUpdateSalaryInput: (value: string) => void;
  onUpdateSalary: () => Promise<void>;
  employerBalHandle: string;

  // Token info
  status: string;
}

const EmployerContext = createContext<EmployerContextValue | undefined>(undefined);

export function EmployerContextProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const waitTx = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  const [referenceUtcPreview, setReferenceUtcPreview] = useState(nowUtcDatetimeLocal());
  useEffect(() => {
    const id = setInterval(() => setReferenceUtcPreview(nowUtcDatetimeLocal()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [updateSalaryInput, setUpdateSalaryInput] = useState("1000");
  const [operatorDays, setOperatorDays] = useState("10");
  const [wrapAmountInput, setWrapAmountInput] = useState("100");

  const [selectedEmployee, setSelectedEmployee] = useState<Address | "">("");
  const [employerBalancePlain, setEmployerBalancePlain] = useState<bigint | null>(null);
  const [selectedSalaryPlain, setSelectedSalaryPlain] = useState<bigint | null>(null);
  const [selectedLastPaymentPlain, setSelectedLastPaymentPlain] = useState<bigint | null>(null);

  const [companyBinding, setCompanyBinding] = useState<Awaited<ReturnType<typeof getEmployerCompanyBinding>>>(null);
  const [companyBindingChainId, setCompanyBindingChainId] = useState<string | null>(null);
  const [rosterRows, setRosterRows] = useState<EmployerRosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [rosterVersion, setRosterVersion] = useState(0);
  const reloadRoster = () => setRosterVersion((v) => v + 1);

  const contracts = useMemo(() => {
    try {
      return getContracts(chainId);
    } catch (e) {
      setStatus(fmtErr(e));
      return null;
    }
  }, [chainId]);

  const registry = contracts?.PayrollFactoryRegistry;
  const wrapper = contracts?.PayrollConfidentialWrapper;
  const payrollAbi = contracts?.PayrollAbi;

  const me = address as Address | undefined;
  const canUseFhe = chainId === sepolia.id;

  const onchainPayroll = useReadContract(
    registry && me
      ? { address: registry.address, abi: registry.abi, functionName: "myCompany", account: me }
      : undefined
  );

  const payrollAddr = (companyBinding?.payroll_contract_address as Address | undefined) ?? (onchainPayroll.data as Address | undefined) ?? ZERO;
  const hasCompany = payrollAddr !== ZERO;
  const backendSynced = !!companyBinding;
  const companyName = companyBinding?.company?.legal_name ?? "(not synced in Supabase)";

  const payrollCompanyRef = useReadContract(
    payrollAbi && hasCompany ? { address: payrollAddr, abi: payrollAbi, functionName: "companyRef" } : undefined
  );

  const wrapperUnderlying = useReadContract(
    wrapper ? { address: wrapper.address, abi: wrapper.abi, functionName: "underlying" } : undefined
  );

  const wrapperRate = useReadContract(
    wrapper ? { address: wrapper.address, abi: wrapper.abi, functionName: "rate" } : undefined
  );

  const underlyingAddr = wrapperUnderlying.data as Address | undefined;

  const underlyingDecimals = useReadContract(
    underlyingAddr ? { address: underlyingAddr, abi: erc20Abi, functionName: "decimals" } : undefined
  );

  const underlyingSymbol = useReadContract(
    underlyingAddr ? { address: underlyingAddr, abi: erc20Abi, functionName: "symbol" } : undefined
  );

  const underlyingBalance = useReadContract(
    underlyingAddr && me ? { address: underlyingAddr, abi: erc20Abi, functionName: "balanceOf", args: [me] } : undefined
  );

  const operatorStatus = useReadContract(
    wrapper && me && hasCompany
      ? { address: wrapper.address, abi: wrapper.abi, functionName: "isOperator", args: [me, payrollAddr] }
      : undefined
  );

  const employerBalHandle = useReadContract(
    wrapper && me ? { address: wrapper.address, abi: wrapper.abi, functionName: "confidentialBalanceOf", args: [me] } : undefined
  );

  const selectedSalaryHandle = useReadContract(
    payrollAbi && hasCompany && me && selectedEmployee
      ? { address: payrollAddr, abi: payrollAbi, functionName: "salaryOfEmployee", args: [selectedEmployee], account: me }
      : undefined
  );

  const selectedLastPaymentHandle = useReadContract(
    payrollAbi && hasCompany && me && selectedEmployee
      ? { address: payrollAddr, abi: payrollAbi, functionName: "lastPaymentOfEmployee", args: [selectedEmployee], account: me }
      : undefined
  );

  const selectedLastPaidPeriod = useReadContract(
    payrollAbi && hasCompany && me && selectedEmployee
      ? { address: payrollAddr, abi: payrollAbi, functionName: "lastRunIdOfEmployee", args: [selectedEmployee], account: me }
      : undefined
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSupabaseCompanyAndRoster() {
      if (!me) {
        if (!cancelled) {
          setCompanyBinding(null);
          setRosterRows([]);
          setSupabaseError(null);
        }
        return;
      }

      try {
        setRosterLoading(true);
        setSupabaseError(null);

        const binding = await getEmployerCompanyBinding({ employerWalletAddress: me, chainId });
        if (!binding) {
          if (!cancelled) {
            setCompanyBinding(null);
            setRosterRows([]);
          }
          return;
        }

        const roster = await getEmployerRoster({ company_onchain_binding_id: binding.company_onchain_binding_id }, me);
        setCompanyBindingChainId(binding.company_onchain_binding_id);

        if (!cancelled) {
          setCompanyBinding(binding);
          setRosterRows(roster);
        }
      } catch (e) {
        if (!cancelled) setSupabaseError(fmtErr(e));
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    }

    loadSupabaseCompanyAndRoster();
    return () => {
      cancelled = true;
    };
  }, [me, chainId, rosterVersion]);

  useEffect(() => {
    if (waitTx.isSuccess) {
      setStatus(`✅ Confirmed: ${txHash}`);
      setTxHash(null);

      wrapperUnderlying.refetch?.();
      wrapperRate.refetch?.();
      underlyingDecimals.refetch?.();
      underlyingSymbol.refetch?.();
      underlyingBalance.refetch?.();
      operatorStatus.refetch?.();
      selectedSalaryHandle.refetch?.();
      selectedLastPaymentHandle.refetch?.();
      selectedLastPaidPeriod.refetch?.();
      employerBalHandle.refetch?.();

      reloadRoster();
    }
  }, [waitTx.isSuccess]);

  async function ensureSepolia() {
    if (chainId !== sepolia.id) {
      setStatus("Switching to Sepolia…");
      await switchChainAsync({ chainId: sepolia.id });
      throw new Error("Switched to Sepolia. Please retry the action.");
    }
  }

  async function sendTx(request: Parameters<typeof writeContractAsync>[0], pendingMessage: string) {
    if (!me) throw new Error("Connect wallet");
    if (!publicClient) throw new Error("Public client not ready");

    await ensureSepolia();
    setStatus(`⏳ ${pendingMessage}`);

    let sim: any;
    try {
      sim = await publicClient.simulateContract({ ...(request as any), account: me, chainId });
    } catch (e) {
      const msg = fmtErr(e);
      setStatus(`❌ Simulation failed: ${msg}`);
      throw e;
    }

    const estimatedGas = (sim?.request?.gas as bigint | undefined) ?? undefined;
    const paddedGas =
      estimatedGas !== undefined ? (estimatedGas * 12n) / 10n + 25_000n : undefined;
    const gas = paddedGas !== undefined ? (paddedGas > RPC_GAS_CAP ? RPC_GAS_CAP : paddedGas) : undefined;

    const hash = await writeContractAsync({ ...(sim.request as any), gas, chainId, account: me });
    setTxHash(hash);
    setStatus(`⏳ Tx sent: ${hash}`);
  }

  async function sendTxAndWait(request: Parameters<typeof writeContractAsync>[0], pendingMessage: string) {
    if (!me) throw new Error("Connect wallet");
    if (!publicClient) throw new Error("Public client not ready");

    await ensureSepolia();
    setStatus(`⏳ ${pendingMessage}`);

    let sim: any;
    try {
      sim = await publicClient.simulateContract({ ...(request as any), account: me, chainId });
    } catch (e) {
      const msg = fmtErr(e);
      setStatus(`❌ Simulation failed: ${msg}`);
      throw e;
    }

    const estimatedGas = (sim?.request?.gas as bigint | undefined) ?? undefined;
    const paddedGas =
      estimatedGas !== undefined ? (estimatedGas * 12n) / 10n + 25_000n : undefined;
    const gas = paddedGas !== undefined ? (paddedGas > RPC_GAS_CAP ? RPC_GAS_CAP : paddedGas) : undefined;

    const hash = await writeContractAsync({ ...(sim.request as any), gas, chainId, account: me });
    setStatus(`⏳ Tx sent: ${hash} — waiting confirmation…`);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  async function approveUnderlyingForWrap() {
    if (!wrapper || !underlyingAddr || !me) throw new Error("Wrapper / underlying not loaded");
    const decimals = Number(underlyingDecimals.data ?? 6);
    const amount = parseUnits(wrapAmountInput || "0", decimals);
    if (amount <= 0n) throw new Error("Wrap amount must be > 0");

    await sendTx(
      { address: underlyingAddr, abi: erc20Abi, functionName: "approve", args: [wrapper.address, amount] },
      `Approving ${wrapAmountInput} ${String(underlyingSymbol.data ?? "ERC20")} for wrapper… (confirm in MetaMask)`
    );
  }

  async function wrapUnderlying() {
    if (!wrapper || !me) throw new Error("Wrapper not loaded");
    const decimals = Number(underlyingDecimals.data ?? 6);
    const amount = parseUnits(wrapAmountInput || "0", decimals);
    if (amount <= 0n) throw new Error("Wrap amount must be > 0");

    await sendTx(
      { address: wrapper.address, abi: wrapper.abi, functionName: "wrap", args: [me, amount] },
      `Wrapping ${wrapAmountInput} ${String(underlyingSymbol.data ?? "ERC20")} into confidential balance… (confirm in MetaMask)`
    );
  }

  async function setOperator() {
    if (!wrapper || !hasCompany) throw new Error("No registered company payroll found");
    const days = Number(operatorDays || "10");
    if (!Number.isFinite(days) || days <= 0) throw new Error("Invalid operator days");
    const until = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

    await sendTx(
      { address: wrapper.address, abi: wrapper.abi, functionName: "setOperator", args: [payrollAddr, BigInt(until)] },
      "Setting payroll operator approval… (confirm in MetaMask)"
    );
  }

  async function updateEmployee(
    row: EmployerRosterRow,
    updates: { job_title?: string | null; employment_status?: string; start_date?: string; end_date?: string | null; active?: boolean }
  ) {
    if (!me) throw new Error("Connect wallet");
    if (!row?.employment_chain_binding_id) throw new Error("Missing employment_chain_binding_id");

    setStatus("💾 Updating employee (off-chain)...");
    await updateEmployeeOffchain({ employment_chain_binding_id: row.employment_chain_binding_id, ...updates }, me);
    setStatus("✅ Employee updated (off-chain)");
    reloadRoster();
  }

  async function removeEmployee(row: EmployerRosterRow) {
    if (!payrollAbi || !hasCompany) throw new Error("No registered company payroll found");

    await sendTx(
      { address: payrollAddr, abi: payrollAbi, functionName: "removeEmployee", args: [row.wallet_address] },
      `Removing employee ${row.wallet_address.slice(0, 10)}… from payroll contract (confirm in MetaMask)`
    );

    try {
      await removeEmployeeFromCompany({ employment_chain_binding_id: row.employment_chain_binding_id }, me!);
      reloadRoster();
    } catch (e) {
      setStatus(`⚠️ Removed on-chain, but Supabase cleanup failed: ${fmtErr(e)}`);
    }
  }

  async function updateSalaryEncrypted() {
    if (!me || !payrollAbi || !hasCompany) throw new Error("No registered company payroll found");
    if (!selectedEmployee) throw new Error("Select an employee from the roster first");
    if (!canUseFhe) throw new Error("Switch to Sepolia to use FHE encryption");

    const decimals = Number(underlyingDecimals.data ?? 6);
    let value: bigint;
    try {
      value = parseUnits(updateSalaryInput || "0", decimals);
    } catch {
      throw new Error("Invalid salary amount");
    }
    if (value <= 0n) throw new Error("Salary must be > 0");
    const UINT64_MAX = (1n << 64n) - 1n;
    if (value > UINT64_MAX) throw new Error("Salary too large for uint64");

    setStatus("🔐 Encrypting salary...");
    const { handle, inputProof } = await encryptUint64({
      chainId,
      contractAddress: payrollAddr,
      userAddress: me,
      value,
    });

    const symLabel = String(underlyingSymbol.data ?? "USDC");
    await sendTx(
      { address: payrollAddr, abi: payrollAbi, functionName: "setSalary", args: [selectedEmployee, handle, inputProof] },
      `Updating encrypted salary to ${updateSalaryInput} ${symLabel}… (confirm in MetaMask)`
    );
  }

  const selectedRow = useMemo(() => {
    if (!selectedEmployee) return null;
    const sel = String(selectedEmployee).toLowerCase();
    return rosterRows.find((r) => String(r.wallet_address).toLowerCase() === sel) ?? null;
  }, [rosterRows, selectedEmployee]);

  const computedEmployeePayrollPeriod = useMemo(() => {
    const cadence = ((selectedRow as any)?.payroll_cadence as PayrollCadence | undefined) ?? "monthly";
    return buildPayrollPeriod(cadence as PayrollCadence, referenceUtcPreview);
  }, [selectedRow, referenceUtcPreview]);

  const computedEmployeeRunId = useMemo(() => {
    const companyRef = payrollCompanyRef.data as `0x${string}` | undefined;
    if (!companyRef) return null;
    return keccak256(encodePacked(["bytes32", "uint256"], [companyRef, computedEmployeePayrollPeriod.id]));
  }, [payrollCompanyRef.data, computedEmployeePayrollPeriod.id]);

  async function runPayrollForSelected() {
    if (!payrollAbi || !hasCompany) throw new Error("No registered company payroll found");
    if (!selectedEmployee) throw new Error("Select an employee from the roster first");
    if (!computedEmployeeRunId) throw new Error("Missing runId — is companyRef loaded?");

    if (operatorStatus.data === false) {
      throw new Error("Payroll contract is NOT approved as operator. Go to Operator Controls → Update, then try again.");
    }

    await sendTx(
      { address: payrollAddr, abi: payrollAbi, functionName: "runPayrollForRun", args: [selectedEmployee, computedEmployeeRunId] },
      `Running payroll for ${selectedEmployee} (${computedEmployeePayrollPeriod.humanLabel})… (confirm in MetaMask)`
    );
  }

  async function readPaidFlags(employees: Address[], runId: `0x${string}`): Promise<boolean[]> {
    if (!publicClient || !payrollAbi || !me) return employees.map(() => false);

    try {
      const results = await publicClient.multicall({
        allowFailure: true,
        contracts: employees.map((emp) => ({
          address: payrollAddr,
          abi: payrollAbi,
          functionName: "paidInRun",
          args: [emp, runId],
          account: me,
        })),
      });
      return results.map((r) => {
        if (!r || r.status !== "success") return false;
        return Boolean((r as any).result);
      });
    } catch {
      const out: boolean[] = [];
      for (const emp of employees) {
        try {
          const v = await publicClient.readContract({
            address: payrollAddr,
            abi: payrollAbi,
            functionName: "paidInRun",
            args: [emp, runId],
            account: me,
          });
          out.push(Boolean(v));
        } catch {
          out.push(false);
        }
      }
      return out;
    }
  }

  async function runPayrollBatchForRoster(referenceDateUtc: string) {
    if (!payrollAbi || !hasCompany) throw new Error("No registered company payroll found");
    if (!me) throw new Error("Connect wallet");
    if (!publicClient) throw new Error("Public client not ready");

    const companyRef = payrollCompanyRef.data as `0x${string}` | undefined;
    if (!companyRef) throw new Error("Missing companyRef — contract not ready yet");

    const activeRows = rosterRows.filter((r) => r.active);
    if (activeRows.length === 0) throw new Error("No active employees in roster");

    const groups = new Map<PayrollCadence, Address[]>();
    for (const r of activeRows) {
      const cadence = (((r as any).payroll_cadence as PayrollCadence | undefined) ?? "monthly") as PayrollCadence;
      if (!groups.has(cadence)) groups.set(cadence, []);
      groups.get(cadence)!.push(r.wallet_address);
    }

    const ref = referenceDateUtc?.trim() ? referenceDateUtc.trim() : nowUtcDatetimeLocal();

    await ensureSepolia();

    let txCount = 0;
    let totalPaidTargets = 0;
    const MAX_BATCH = 200;
    const cadenceOrder: PayrollCadence[] = ["monthly", "semiMonthly", "weekly"];
    const ordered = cadenceOrder.filter((c) => groups.has(c)).map((c) => [c, groups.get(c)!] as const);

    for (const [cadence, employeesAll] of ordered) {
      const period = buildPayrollPeriod(cadence, ref);
      const runId = keccak256(encodePacked(["bytes32", "uint256"], [companyRef, period.id])) as `0x${string}`;

      setStatus(`🔎 Checking who is already paid for ${cadence} (${period.humanLabel})…`);

      const paidFlags = await readPaidFlags(employeesAll, runId);
      const dueEmployees = employeesAll.filter((_, i) => !paidFlags[i]);

      if (dueEmployees.length === 0) {
        setStatus(`ℹ️ ${cadence}: everyone already paid for this runId. Skipping.`);
        continue;
      }

      totalPaidTargets += dueEmployees.length;

      for (let i = 0; i < dueEmployees.length; i += MAX_BATCH) {
        const chunk = dueEmployees.slice(i, i + MAX_BATCH);
        const idx = Math.floor(i / MAX_BATCH) + 1;
        const total = Math.ceil(dueEmployees.length / MAX_BATCH);

        await sendTxAndWait(
          {
            address: payrollAddr,
            abi: payrollAbi,
            functionName: "runPayrollBatchForRun",
            args: [chunk, runId],
          },
          `Running ${cadence} payroll (${period.humanLabel}) — batch ${idx}/${total} for ${chunk.length} employee(s)… (confirm in MetaMask)`
        );

        txCount += 1;
      }
    }

    wrapperUnderlying.refetch?.();
    wrapperRate.refetch?.();
    underlyingDecimals.refetch?.();
    underlyingSymbol.refetch?.();
    underlyingBalance.refetch?.();
    operatorStatus.refetch?.();
    selectedSalaryHandle.refetch?.();
    selectedLastPaymentHandle.refetch?.();
    selectedLastPaidPeriod.refetch?.();
    employerBalHandle.refetch?.();
    reloadRoster();

    if (txCount === 0) {
      setStatus("ℹ️ No payroll transactions were needed (everyone was already paid for the chosen runIds).");
      return;
    }

    setStatus(`✅ Payroll batch complete: ${txCount} tx(s) sent, ${totalPaidTargets} employee payouts targeted.`);
  }

  async function decryptEmployerBalance() {
    if (!walletClient || !wrapper || !employerBalHandle.data) throw new Error("Missing balance handle");
    if (!canUseFhe) throw new Error("Switch to Sepolia to decrypt via relayer.");
    setStatus("🔓 Decrypting employer token balance (signature required)...");
    const value = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: wrapper.address,
      handle: handleToHex32(employerBalHandle.data),
    });
    setEmployerBalancePlain(value);
    setStatus("✅ Employer balance decrypted");
  }

  async function decryptSelectedSalary() {
    if (!walletClient || !payrollAbi || !hasCompany || !selectedSalaryHandle.data) throw new Error("Missing salary handle");
    if (!canUseFhe) throw new Error("Switch to Sepolia to decrypt via relayer.");
    setStatus("🔓 Decrypting selected employee salary (signature required)...");
    const value = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: payrollAddr,
      handle: handleToHex32(selectedSalaryHandle.data),
    });
    setSelectedSalaryPlain(value);
    setStatus("✅ Salary decrypted");
  }

  async function decryptSelectedLastPayment() {
    if (!walletClient || !payrollAbi || !hasCompany || !selectedLastPaymentHandle.data) throw new Error("Missing last payment handle");
    if (!canUseFhe) throw new Error("Switch to Sepolia to decrypt via relayer.");
    setStatus("🔓 Decrypting selected employee last payment (signature required)...");
    const value = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: payrollAddr,
      handle: handleToHex32(selectedLastPaymentHandle.data),
    });
    setSelectedLastPaymentPlain(value);
    setStatus("✅ Last payment decrypted");
  }

  async function handleDeleteCompany() {
    if (!me || !payrollAbi || !registry || !companyBinding) throw new Error("No registered company found");
    if (!publicClient) throw new Error("Public client not ready");

    await ensureSepolia();

    setStatus("⏳ Step 1/3 — Deactivating payroll contract… (confirm in MetaMask)");
    const hash1 = await writeContractAsync({
      address: payrollAddr,
      abi: payrollAbi,
      functionName: "deactivate",
      chainId,
      account: me,
    });
    setStatus(`⏳ Step 1/3 — Waiting for deactivation tx: ${hash1}`);
    await publicClient.waitForTransactionReceipt({ hash: hash1 });

    setStatus("⏳ Step 2/3 — Removing from registry… (confirm in MetaMask)");
    const hash2 = await writeContractAsync({
      address: registry.address,
      abi: registry.abi,
      functionName: "deleteCompany",
      chainId,
      account: me,
    });
    setStatus(`⏳ Step 2/3 — Waiting for registry tx: ${hash2}`);
    await publicClient.waitForTransactionReceipt({ hash: hash2 });

    setStatus("⏳ Step 3/3 — Erasing company data from database…");
    await deleteCompanyOffchain({ company_onchain_binding_id: companyBinding.company_onchain_binding_id }, me);

    router.push(`/${locale}`);
  }

  function handleExportCsv() {
    const headers = ["Wallet Address", "Job Title", "Start Date", "Status"];
    const rows = rosterRows.map((row) => [
      row.wallet_address,
      row.job_title || "",
      row.start_date,
      row.active ? "Active" : "Inactive",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const underlyingDecimalsValue = Number(underlyingDecimals.data ?? 6);
  const symLabel = String(underlyingSymbol.data ?? "USDC");

  const underlyingBalanceFormatted =
    typeof underlyingBalance.data === "bigint" ? formatUnits(underlyingBalance.data, underlyingDecimalsValue) : "(loading)";

  const employerConfidentialBalanceFormatted =
    employerBalancePlain !== null ? formatUnits(employerBalancePlain, underlyingDecimalsValue) : null;

  const selectedSalaryFormatted =
    selectedSalaryPlain !== null ? formatUnits(selectedSalaryPlain, underlyingDecimalsValue) : null;

  const selectedLastPaymentFormatted =
    selectedLastPaymentPlain !== null ? formatUnits(selectedLastPaymentPlain, underlyingDecimalsValue) : null;

  const activeEmployeeCount = useMemo(() => rosterRows.filter((r) => r.active).length, [rosterRows]);
  const activeCadenceCount = useMemo(() => {
    const set = new Set<string>();
    for (const r of rosterRows) {
      if (!r.active) continue;
      const c = (r as any).payroll_cadence as PayrollCadence | undefined;
      set.add(c ?? "monthly");
    }
    return set.size;
  }, [rosterRows]);

  const employerBalHandleString = String(employerBalHandle.data ?? "(none / loading)");
  const selectedSalaryHandleString = String(selectedSalaryHandle.data ?? "(none)");
  const selectedLastPaymentHandleString = String(selectedLastPaymentHandle.data ?? "(none)");
  const selectedLastPaidPeriodString = String(selectedLastPaidPeriod.data ?? "(none)");

  const value: EmployerContextValue = {
    locale,
    registryAddress: registry?.address,
    wrapperAddress: wrapper?.address,
    underlyingAddr,
    payrollAddr,
    wrapperRate: String(wrapperRate.data ?? "(loading)"),
    hasCompany,
    backendSynced,
    supabaseError,
    companyName,
    canUseFhe,
    underlyingSymbol: symLabel,
    underlyingDecimalsValue,
    underlyingBalanceFormatted,
    wrapAmountInput,
    setWrapAmountInput,
    onApproveWrap: approveUnderlyingForWrap,
    onWrap: wrapUnderlying,
    employerConfidentialBalanceFormatted,
    onDecryptBalance: decryptEmployerBalance,
    operatorStatus: operatorStatus.data as boolean | undefined,
    operatorDays,
    setOperatorDays,
    onSetOperator: setOperator,
    payrollAbi,
    companyOnchainBindingId: companyBindingChainId,
    onSuccess: reloadRoster,
    onDeleteCompany: handleDeleteCompany,
    onExportCsv: handleExportCsv,
    rosterRows,
    rosterLoading,
    selectedEmployee,
    onSelectEmployee: (addr) => setSelectedEmployee(addr),
    onRemoveEmployee: removeEmployee,
    onUpdateEmployeeOffchain: updateEmployee,
    selectedRow,
    computedEmployeePayrollPeriod,
    computedEmployeeRunId,
    onRunPayrollSingle: runPayrollForSelected,
    onRunPayrollBatch: runPayrollBatchForRoster,
    activeEmployeeCount,
    activeCadenceCount,
    selectedSalaryPlain,
    selectedLastPaymentPlain,
    selectedSalaryFormatted,
    selectedLastPaymentFormatted,
    selectedSalaryHandle: selectedSalaryHandleString,
    selectedLastPaymentHandle: selectedLastPaymentHandleString,
    selectedLastPaidPeriod: selectedLastPaidPeriodString,
    onDecryptSalary: decryptSelectedSalary,
    onDecryptLastPayment: decryptSelectedLastPayment,
    updateSalaryInput,
    setUpdateSalaryInput,
    onUpdateSalary: updateSalaryEncrypted,
    employerBalHandle: employerBalHandleString,
    status,
  };

  return <EmployerContext.Provider value={value}>{children}</EmployerContext.Provider>;
}

export function useEmployerContext() {
  const context = useContext(EmployerContext);
  if (!context) {
    throw new Error("useEmployerContext must be used within EmployerContextProvider");
  }
  return context;
}
