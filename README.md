<div align="center">

<br/>

<img src="https://img.shields.io/badge/Paychain-FFD208?style=for-the-badge&labelColor=000000&logoColor=FFD208" height="60" alt="Paychain"/>

<br/><br/>

# Confidential Payroll-as-a-Service

### *The first payroll platform where salaries are mathematically private — not just policy-private.*

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-FFD208?style=for-the-badge&labelColor=000000&logo=vercel&logoColor=FFD208)](https://paychain-on-chain-payroll-web.vercel.app/en)
[![YouTube Demo](https://img.shields.io/badge/Watch%20Demo-YouTube-FFD208?style=for-the-badge&labelColor=000000&logo=youtube&logoColor=FFD208)](https://www.youtube.com/watch?v=MmXgJsYRZHo)

[![Built with fhEVM](https://img.shields.io/badge/Built%20with-fhEVM-FFD208?style=flat-square&labelColor=000000)](https://www.zama.ai/)
[![Zama Bounty](https://img.shields.io/badge/Zama-Special%20Bounty-FFD208?style=flat-square&labelColor=000000)](https://www.zama.ai/)
[![ERC-7984](https://img.shields.io/badge/Token-ERC--7984-FFD208?style=flat-square&labelColor=000000)](https://eips.ethereum.org/)
[![GDPR by Design](https://img.shields.io/badge/GDPR-By%20Design-10B981?style=flat-square&labelColor=000000)](./GDPR.md)
[![Network](https://img.shields.io/badge/Network-Sepolia%20%7C%20Localhost-FFD208?style=flat-square&labelColor=000000)]()
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Hardhat%20%7C%20Supabase-FFD208?style=flat-square&labelColor=000000)]()
[![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-FFD208?style=flat-square&labelColor=000000)]()

<br/>

---

<table width="100%">
<tr>
<td width="100%" valign="top" align="center">

**🚀 &nbsp;Try it now**

[Live Demo on Vercel](https://paychain-on-chain-payroll-web.vercel.app/en) &nbsp;·&nbsp; [Watch Demo on YouTube](https://www.youtube.com/watch?v=MmXgJsYRZHo)

</td>
</tr>
<tr>
<td width="100%" valign="top" align="center">

**📖 &nbsp;Understand the project**

[Overview](#-overview) &nbsp;·&nbsp; [Why Paychain](#-why-paychain) &nbsp;·&nbsp; [Participants](#-participants--entities) &nbsp;·&nbsp; [Architecture](#-architecture) &nbsp;·&nbsp; [Smart Contracts](#-smart-contracts) &nbsp;·&nbsp; [On-chain / Off-chain](#-on-chain--off-chain-design) &nbsp;·&nbsp; [GDPR](#-gdpr--privacy-by-design) &nbsp;·&nbsp; [Security](#-security)

</td>
</tr>
<tr>
<td width="100%" valign="top" align="center">

**🛠️ &nbsp;Build and deploy**

[Prerequisites](#-prerequisites) &nbsp;·&nbsp; [Local Deployment](#-local-deployment) &nbsp;·&nbsp; [Sepolia Deployment](#-sepolia-deployment) &nbsp;·&nbsp; [End-to-End Flow](#-end-to-end-user-flow) &nbsp;·&nbsp; [Tech Stack](#-tech-stack)

</td>
</tr>
</table>

---

</div>

<br/>

## 🎬 Live Demo

<div align="center">
<table>
<tr>
<td align="center" width="50%">

### 🌐 Try it Live

[![Live Demo](https://img.shields.io/badge/Open%20Live%20Demo-Vercel-ffffff?style=for-the-badge&logo=vercel&logoColor=000000&labelColor=000000)](https://paychain-on-chain-payroll-web.vercel.app/en)

Runs against **Sepolia testnet**<br/>
Connect MetaMask on Sepolia to explore<br/>
the Employer and Employee portals.

</td>
<td align="center" width="50%">

### 🎥 Watch the Demo

[![Watch on YouTube](https://img.shields.io/badge/Watch%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white&labelColor=FF0000)](https://www.youtube.com/watch?v=MmXgJsYRZHo)

Full **end-to-end walkthrough** of<br/>
the confidential payroll flow —<br/>
from wrap to payment to unwrap.

</td>
</tr>
</table>
</div>

<br/>

## 🔍 Overview

**Paychain** is a confidential, non-custodial payroll platform for companies that pay employees in stablecoins. Built on **Zama's fhEVM** (Fully Homomorphic Encryption Virtual Machine), it guarantees that salary amounts are **mathematically unreadable** on-chain — not even blockchain validators, indexers, or block explorers can see them.

This is fundamentally different from every existing crypto-payroll tool. When a company pays employees via Request Finance, Coinshift, or Superfluid today, every salary is broadcast in plaintext to a public ledger. Any competitor, journalist, disgruntled employee, or regulator can go to Etherscan right now and see exactly what each employee earns, when they were last paid, and when they left.

**Paychain closes that gap entirely.** Salaries live as FHE-encrypted `euint64` handles on-chain. Employee personal identity data lives AES-256-GCM encrypted in Supabase. Nothing is plaintext, anywhere.

<br/>

## ⚡ Why Paychain

<table>
<thead>
<tr>
<th>Feature</th>
<th>Traditional Crypto Payroll</th>
<th><strong>Paychain</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>Salary visibility on-chain</td>
<td>❌ Public plaintext on Etherscan</td>
<td>✅ FHE-encrypted, unreadable</td>
</tr>
<tr>
<td>Employee PII storage</td>
<td>❌ Plaintext in SaaS DB</td>
<td>✅ AES-256-GCM encrypted at rest</td>
</tr>
<tr>
<td>Employer custody of funds</td>
<td>❌ Custodial (you send to them)</td>
<td>✅ Non-custodial (operator approval only)</td>
</tr>
<tr>
<td>Employee self-service portal</td>
<td>❌ None</td>
<td>✅ Private decryption portal</td>
</tr>
<tr>
<td>GDPR compliance</td>
<td>⚠️ Partial</td>
<td>✅ By design (cascade delete, encryption, audit trail)</td>
</tr>
<tr>
<td>Duplicate payment protection</td>
<td>❌ Manual</td>
<td>✅ Enforced on-chain per pay run</td>
</tr>
</tbody>
</table>

> **One-liner:** *Etherscan-proof payroll.* Any company that has ever googled their own Ethereum address and seen their payroll broadcast publicly will immediately understand the value.

<br/>

## 👥 Participants & Entities

Paychain operates with three distinct roles, each with a well-defined scope of action both on-chain and off-chain.

<br/>

### 🏗️ Platform Admin

> The entity that deploys and operates the Paychain SaaS infrastructure.

The Platform Admin is the deployer of the two shared platform-level contracts:

- Deploys `PayrollConfidentialWrapper` — the confidential ERC-7984 token backed 1:1 by USDC
- Deploys `PayrollFactoryRegistry` — the on-chain factory that mints one `Payroll` contract per employer

The Platform Admin never touches employer funds or employee data. Their role is infrastructure provisioning only. In a production context, this role would be held by a multisig or a DAO.

<br/>

### 🏢 Employer

> A company that subscribes to Paychain to run confidential stablecoin payroll.

**On-chain actions:**
1. Calls `PayrollFactoryRegistry.registerCompany(companyRef)` — receives a dedicated `Payroll` contract
2. Approves their USDC to the `PayrollConfidentialWrapper` and wraps it into confidential `cpUSD` tokens
3. Grants the `Payroll` contract operator approval on their confidential token balance
4. Adds employees (`addEmployee`), sets encrypted salaries (`setSalary`), and runs payroll (`runPayrollBatchForRun`)

**Off-chain actions (Supabase):**
- Registers company legal identity, country, and on-chain binding
- Registers employees with encrypted PII (name, DNI, email — all AES-256-GCM encrypted server-side)
- Manages employment relationships, payroll periods, and status

**What the Employer can decrypt:**
- Their own confidential token balance
- Each employee's encrypted salary and last payment (via employer-role FHE ACL grant)

<br/>

### 👤 Employee

> A recipient of confidential stablecoin payroll.

**On-chain actions:**
1. Receives salary via `confidentialTransferFrom` — balance is FHE-encrypted, invisible to observers
2. Can decrypt their own salary and last payment via the Employee Private Portal
3. Can approve the `Payroll` contract as wrapper operator and call `requestUnwrap` to convert confidential `cpUSD` back to plain USDC

**Off-chain actions (Supabase):**
- Discovered automatically when connecting their wallet — the platform finds their employment bindings
- Can exercise GDPR data subject rights (access, rectification, erasure) via the DSR workflow

**What the Employee can decrypt:**
- Only their own salary and last payment (FHE ACL is scoped strictly to the employee's wallet)
- Their confidential token balance

<br/>

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Paychain PLATFORM                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    BLOCKCHAIN LAYER                     │    │
│  │                  (Ethereum / Sepolia)                   │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  PayrollConfidentialWrapper  (deployed by Admin) │  │    │
│  │  │  ERC-7984 confidential token · backed by USDC    │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                           │                             │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  PayrollFactoryRegistry  (deployed by Admin)     │  │    │
│  │  │  Factory · deploys one Payroll per employer      │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │           │                    │                        │    │
│  │  ┌────────────────┐   ┌────────────────┐               │    │
│  │  │  Payroll A     │   │  Payroll B     │  ...          │    │
│  │  │  (Employer A)  │   │  (Employer B)  │               │    │
│  │  │  euint64 salaries, FHE ACLs, run locks             │    │
│  │  └────────────────┘   └────────────────┘               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  OFF-CHAIN LAYER (Supabase)             │    │
│  │                                                         │    │
│  │  company · company_onchain_binding                      │    │
│  │  person · person_identity (AES-256-GCM encrypted)       │    │
│  │  person_wallet · employment · employment_chain_binding  │    │
│  │  payroll_period · payroll_entry                         │    │
│  │  access_audit_log · data_subject_request                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               FRONTEND (Next.js / apps/web)             │    │
│  │                                                         │    │
│  │  /              Landing · role detection                │    │
│  │  /employer       Employer Management Dashboard          │    │
│  │  /employee       Employee Private Portal                │    │
│  │                                                         │    │
│  │  wagmi · @zama-fhe/relayer-sdk · @payroll/sdk           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

## 📜 Smart Contracts

Three contracts form the complete system. The Platform Admin deploys the first two; the third is deployed automatically by the factory when each employer registers.

<br/>

### `PayrollConfidentialWrapper`

> **Deployed by:** Platform Admin · **One instance per platform**

A confidential ERC-7984 token that wraps any ERC-20 (e.g. USDC) at a 1:1 rate. Based on OpenZeppelin's `ERC7984ERC20Wrapper`.

| Function | Description |
|---|---|
| `wrap(to, amount)` | Employer deposits USDC, receives confidential `cpUSD` |
| `unwrap(from, to, encryptedAmount, proof)` | Burn confidential tokens, receive USDC |
| `setOperator(payrollContract, until)` | Grant the Payroll contract permission to spend from balance |
| `isOperator(owner, operator)` | Check if operator approval is active |

All balances are FHE-encrypted. No one observing the blockchain can determine how much `cpUSD` any address holds.

<br/>

### `PayrollFactoryRegistry`

> **Deployed by:** Platform Admin · **One instance per platform**

A factory/registry that maps each employer wallet to their dedicated `Payroll` contract.

| Function | Description |
|---|---|
| `registerCompany(companyRef)` | Deploy a new `Payroll` for `msg.sender`; `companyRef` is an opaque `keccak256` hash of the off-chain UUID |
| `myCompany()` | Employer self-lookup for their Payroll address |
| `deleteCompany()` | Deregister the company; call `Payroll.deactivate()` first |
| `isRegisteredPayroll(addr)` | Public check: is this address a valid Paychain payroll contract? |

The employer↔payroll mapping is stored `private` — there is no convenience public getter to avoid unnecessary exposure of business relationships.

<br/>

### `Payroll`

> **Deployed by:** `PayrollFactoryRegistry` on `registerCompany()` · **One instance per employer**

The core payroll contract. Manages employees, encrypted salaries, and payroll execution. Uses OpenZeppelin `AccessControl` and `ReentrancyGuard`.

| Function | Caller | Description |
|---|---|---|
| `addEmployee(address)` | `EMPLOYER_ROLE` | Register an employee wallet |
| `removeEmployee(address)` | `EMPLOYER_ROLE` | Deactivate and clear all payroll state |
| `setSalary(address, encryptedSalary, proof)` | `EMPLOYER_ROLE` | Set FHE-encrypted salary (euint64) |
| `runPayrollBatchForRun(employees[], runId)` | `EMPLOYER_ROLE` | Pay up to 200 employees in one transaction, duplicate-protected |
| `requestUnwrap(to, encryptedAmount, proof)` | Employee | Initiate unwrap of confidential tokens → USDC |
| `mySalary()` | Employee (self) | Get own encrypted salary handle |
| `myLastPayment()` | Employee (self) | Get own last payment handle |
| `deactivate()` | `EMPLOYER_ROLE` | Permanently lock the contract |

**Key design decisions:**
- `addEmployee` / `removeEmployee` emit **no events** to avoid broadcasting HR metadata on-chain
- Salary updates emit **no events** — they are sensitive HR data
- Run IDs are computed as `keccak256(companyRef, periodId)` client-side — opaque on-chain, preventing semantic period inference
- Payment source is always the canonical `employer` wallet, even when a delegated operator executes the run

<br/>

## 🔀 On-chain / Off-chain Design

This is the most important architectural decision in Paychain, and it was made deliberately to balance **cryptographic privacy**, **GDPR compliance**, and **operational practicality**.

<br/>

### What lives on-chain

| Data | Type | Why on-chain |
|---|---|---|
| Salary amounts | `euint64` (FHE-encrypted) | Must be on-chain for trustless confidential token transfers |
| Last payment amounts | `euint64` (FHE-encrypted) | Audit proof for employee; must be immutable and verifiable |
| Employee wallet addresses | `address` (public) | Required for ERC-7984 token transfer recipient identification |
| Payroll run locks | `mapping(address => mapping(bytes32 => bool))` | Duplicate-payment prevention must be on-chain (otherwise manipulable) |
| Operator approvals | ERC-7984 standard | Trustless authorization; can't be stored off-chain |
| Confidential token balances | `euint64` (FHE-encrypted) | Fundamental token contract requirement |

> **Why FHE for salary amounts specifically?** Because any off-chain system (including an encrypted database) relies on *policy trust* — you trust that the database operator doesn't look. FHE provides *cryptographic trust* — the EVM itself cannot compute plaintext salary values. The guarantee is mathematical, not contractual.

<br/>

### What lives off-chain (Supabase)

| Data | Protection | Why off-chain |
|---|---|---|
| Employee names, DNI, email | AES-256-GCM encrypted server-side | GDPR Article 17 (right to erasure) — blockchain is immutable; off-chain data can be deleted |
| Employment relationships | Encrypted + access-controlled API routes | Roster enumeration on-chain would expose HR metadata in calldata and events |
| Company legal identity | Row-level secured | Not needed for fund movement; only needed for HR and compliance workflows |
| Payroll period metadata | Structured DB | Enables reporting, filtering, audit exports — impractical on-chain |
| GDPR audit log | Server-side append-only | Article 5(2) accountability; must be tamper-resistant but not public |
| Data Subject Requests | DB workflow table | DSR handling is a legal process, not a financial transaction |

> **Why Supabase for PII specifically?** Blockchain data is immutable. If an employee exercises their GDPR right to erasure (Article 17), their personal data must be deletable. FHE can hide amounts, but it cannot erase calldata history. Supabase allows cascade deletes across the full identity tree: `employment_chain_binding → employment → person_wallet → person_identity → person`.

<br/>

### The hybrid boundary

```
EMPLOYER wants to run payroll for EMPLOYEE
                │
                ▼
    Frontend reads Supabase
    to get: employee wallet address
    (never exposed on-chain in plaintext
     beyond what the token transfer requires)
                │
                ▼
    Frontend computes runId:
    keccak256(companyRef, periodId)
    ← opaque on-chain, meaningful off-chain only
                │
                ▼
    Employer calls Payroll.runPayrollBatchForRun()
    with [wallet addresses] and runId
    ← salary amount is already on-chain as euint64
    ← FHE gateway performs encrypted transfer
                │
                ▼
    Only event emitted: PayrollRunExecuted(runId, employeeCount)
    ← no individual addresses, no amounts, no names
```

<br/>

## 🛡️ GDPR & Privacy by Design

Paychain is built to satisfy **GDPR Article 25 (Privacy by Design and by Default)**. Privacy is not a policy layer — it is a technical guarantee at every layer.

<br/>

| Requirement | Article | Implementation |
|---|---|---|
| Encrypt PII at rest | Art. 25, 32 | AES-256-GCM for all `person_identity` fields, server-side only |
| Encrypt amounts on-chain | Art. 25, 32 | FHE `euint64` — amounts are mathematically unreadable |
| Minimise on-chain personal data | Art. 5(1)(c) | Only wallet addresses on-chain; all identity in Supabase |
| Server-side key isolation | Art. 32 | `IDENTITY_ENCRYPTION_KEY` never reaches the browser |
| Support erasure (technical capability) | Art. 17 | Cascade delete: `employment_chain_binding → employment → person_wallet → person_identity → person` |
| Key rotation support | Art. 32 | `encryption_key_ref` column tracks which key version encrypted each record |
| Restrict access by role | Art. 5(1)(f) | `EMPLOYER_ROLE` on-chain + API route ownership check + Supabase RLS |
| No third-party trackers | Art. 5(1)(c) | Zero analytics scripts in the frontend |
| HMAC-based searchable fields | Art. 25 | DNI lookup via `HMAC-SHA256` — no plaintext ever stored |

> See [GDPR.md](./GDPR.md) for the full compliance assessment, including residual risks, open action items, and the DPIA trigger analysis.

<br/>

## 🔒 Security

The system applies defense-in-depth across three layers:

| Layer | Controls |
|---|---|
| **On-chain** | OpenZeppelin `AccessControl` (`EMPLOYER_ROLE`) · FHE-encrypted salary/payment values · Per-run duplicate payment lock · Canonical employer-wallet payer semantics · Operator approval checks · `ReentrancyGuard` · `MAX_BATCH_SIZE = 200` cap |
| **Off-chain (API)** | All mutations via server-side Next.js API routes · Supabase service-role key never exposed to browser · Server-side ownership check (`x-employer-wallet` verified against DB) · Supabase Row Level Security as second layer |
| **Off-chain (DB)** | AES-256-GCM field-level encryption for all PII · HMAC-SHA256 for searchable fields · `encryption_key_ref` for key rotation · Cascade delete for right to erasure |

> ⚠️ This is **not a formal audit**. Smart contracts have not been independently audited. Do not use in production with real funds before a security audit is completed. See [SECURITY.md](./SECURITY.md) for the full threat model.

<br/>

## 🗂️ Repository Structure

```
Paychain On-Chain Payroll/
│
├── apps/
│   └── web/                          # Next.js frontend (Employer + Employee dApp)
│       ├── app/
│       │   ├── [lang]/
│       │   │   ├── employer/page.tsx  # Employer Management Dashboard
│       │   │   └── employee/page.tsx  # Employee Private Portal
│       │   └── api/
│       │       ├── company/           # /register-employee, /roster, /remove-employee
│       │       └── employee/          # /bindings
│       ├── components/               # Connect, Nav, NetworkStatus, ThemeToggle, UI
│       └── lib/                      # wagmi config, FHE helpers, API auth, Supabase client
│
├── packages/
│   ├── contracts/                    # Hardhat project
│   │   ├── contracts/
│   │   │   ├── Payroll.sol                      # Core payroll contract (per employer)
│   │   │   ├── PayrollFactoryRegistry.sol        # Factory (platform-level)
│   │   │   └── PayrollConfidentialWrapper.sol    # ERC-7984 confidential token (platform-level)
│   │   ├── deploy/
│   │   │   └── 001_deploy_platform.ts            # Deploys Wrapper + Registry
│   │   └── hardhat.config.ts
│   │
│   └── sdk/                          # @payroll/sdk — shared ABIs + addresses + FHE helpers
│       └── src/
│           ├── generated/            # Auto-generated from deploy (localhost.ts / sepolia.ts)
│           └── index.ts
│
├── BUSINESS.md                       # Business model, GTM, competitive landscape
├── GDPR.md                           # Full GDPR compliance assessment
└── SECURITY.md                       # Threat model and security controls
```

<br/>

## 🛠️ Prerequisites

Before deploying or running the project, make sure you have the following installed:

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | 18+ or 20+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 10+ | `npm i -g pnpm` |
| **MetaMask** | Latest | [metamask.io](https://metamask.io/download/) |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |

```bash
# Verify your setup
node -v       # v18.x or v20.x
pnpm -v       # 10.x
```

<br/>

## 💻 Local Deployment

Local deployment runs a Hardhat node on your machine with a mock ERC-20 token in place of USDC. No real ETH is needed.

<br/>

### Step 1 — Clone and install

```bash
git clone https://github.com/your-org/zama-special-bounty-feb-2026.git
cd zama-special-bounty-feb-2026
pnpm install
```

<br/>

### Step 2 — Start the local blockchain

Open **Terminal A** and keep it running:

```bash
pnpm chain
```

Hardhat will print a list of funded test accounts with their private keys:

```
Account #0: 0xf39Fd6e51...  (10000 ETH)
Private Key: 0xac0974bec...

Account #1: 0x70997970C...  (10000 ETH)
Private Key: 0x59c6995e9...
```

Copy two private keys — you'll import them into MetaMask as **Employer** and **Employee**.

<br/>

### Step 3 — Deploy contracts

Open **Terminal B**:

```bash
pnpm deploy:local
```

This deploys `MockERC20`, `PayrollConfidentialWrapper`, and `PayrollFactoryRegistry` to your local chain.

<br/>

### Step 4 — Export ABIs to the SDK

```bash
pnpm contracts:export
```

This generates `packages/sdk/src/generated/localhost.ts` with the deployed addresses and ABIs, so the frontend auto-discovers them.

<br/>

### Step 5 — Start the dApp

Open **Terminal C**:

```bash
pnpm web
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

<br/>

### Step 6 — Configure MetaMask for localhost

1. Open MetaMask → **Settings** → **Networks** → **Add a network manually**

| Field | Value |
|---|---|
| Network Name | `Hardhat Localhost` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

2. **Import the Employer account:**
   MetaMask → **Account Menu** → **Add Account / Import Account** → paste Private Key #0

3. **Import the Employee account:**
   Repeat with Private Key #1

You now have two accounts ready. Use the Employer account to register a company and run payroll. Use the Employee account to view the private portal and unwrap tokens.

<br/>

### Run contract tests

```bash
pnpm --filter @payroll/contracts compile
pnpm contracts:test
```

<br/>

## 🌐 Sepolia Deployment

Sepolia is Ethereum's public testnet. Deploying here gives you a shared environment where the dApp runs against real network conditions: mempool, dynamic gas, rate-limited RPCs, and Etherscan verification.

**Chain ID:** `11155111`

<br/>

### Step 1 — Configure MetaMask for Sepolia

1. MetaMask → **Settings** → **Networks** → **Show test networks** → enable toggle
2. Select **Sepolia** from the network list
3. Create **three new accounts** in MetaMask:

| Account | Role | Purpose |
|---|---|---|
| `PlatformAdmin` | Deployer | Deploys `PayrollConfidentialWrapper` and `PayrollFactoryRegistry` |
| `Employer` | Company owner | Registers company, manages employees, runs payroll |
| `Employee` | Worker | Receives encrypted payroll, views private portal |

<br/>

### Step 2 — Fund your accounts with Sepolia ETH

You need Sepolia ETH to pay gas. Use any of these faucets:

| Faucet | Notes |
|---|---|
| [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) | Best option — no prerequisites |
| [Chainlink Faucet](https://faucets.chain.link/sepolia) | Requires 1 LINK on mainnet |
| [Infura Faucet](https://www.infura.io/faucet/sepolia) | Limited to once per day |

> **Tip:** If a faucet limits requests per account, fund one account and transfer to the others via MetaMask.

<br/>

### Step 3 — Get Sepolia USDC

Paychain wraps USDC into confidential tokens. Get test USDC from the [Circle Faucet](https://faucet.circle.com/).

- Get USDC for both `PlatformAdmin` and `Employer`
- The USDC address on Sepolia is: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

<br/>

### Step 4 — Get a Sepolia RPC URL

You need an RPC endpoint to deploy and interact with Sepolia. Choose one:

**Infura:**
1. Create an account at [developer.metamask.io](https://developer.metamask.io/)
2. Create a new API key for Ethereum
3. In Products → Infura RPC → select **Sepolia**
4. Your URL: `https://sepolia.infura.io/v3/<YOUR_PROJECT_ID>`

**Alchemy:**
1. Create an account at [alchemy.com](https://www.alchemy.com/)
2. Create an app for **Ethereum Sepolia**
3. Copy the HTTPS URL: `https://eth-sepolia.g.alchemy.com/v2/<api-key>`

> 💡 In production, whitelist your server IP in the Infura/Alchemy dashboard to prevent key abuse.

<br/>

### Step 5 — Set up Supabase

The off-chain PII storage runs on Supabase. Create a free project at [supabase.com](https://supabase.com).

1. Create a new project
2. Run the DBML schema from `dbdiagrams.io/mvp.dbml` in the Supabase SQL editor to create all tables
3. Note down your:
   - **Project URL** (format: `https://xxxx.supabase.co`)
   - **Publishable (anon) key**
   - **Service role key** (keep this secret — never expose to the browser)
   - **Database URL** (from Project Settings → Database → Connection string)

<br/>

### Step 6 — Create environment files

**`packages/contracts/.env`** (for contract deployment):

```bash
# Sepolia RPC endpoint URL
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"

# Private key of the PlatformAdmin wallet (will deploy contracts)
# ⚠️  Never commit this file. It is in .gitignore.
PRIVATE_KEY="0xYOUR_PLATFORM_ADMIN_PRIVATE_KEY"

# USDC address on Ethereum Sepolia
PAYROLL_UNDERLYING_ERC20="0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
```

**`apps/web/.env.local`** (for the frontend):

```bash
# Sepolia RPC endpoint (same as above — used by the frontend for on-chain reads)
NEXT_PUBLIC_SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"

# Supabase connection (public values — safe for browser)
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_..."

# Supabase connection (server-side only — NEVER expose to browser)
DATABASE_URL="postgresql://postgres.xxxx.supabase.co:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="..."

# PII encryption key — 32 random bytes as hex
# Generate with: openssl rand -hex 32
# ⚠️  In production, use a KMS (AWS KMS, GCP Cloud KMS, HashiCorp Vault)
IDENTITY_ENCRYPTION_KEY="..."

# HMAC secret for searchable fields (DNI lookup without decryption)
# Generate with: openssl rand -base64 32
IDENTITY_HMAC_SECRET="..."
```

> **Security note:** `.env` and `.env.local` are in `.gitignore`. Never commit them. The `IDENTITY_ENCRYPTION_KEY` compromise exposes all stored PII — treat it like a production database root password.

<br/>

### Step 7 — Deploy to Sepolia

```bash
# 1. Deploy PayrollConfidentialWrapper + PayrollFactoryRegistry
pnpm deploy:sepolia

# 2. Export deployed addresses + ABIs to the SDK
#    (frontend will auto-use Sepolia addresses after this)
pnpm contracts:export:sepolia
```

> Unlike localhost, you do **not** run `pnpm chain`. Sepolia is a public network — you just need a funded private key and an RPC URL.

<br/>

### Step 8 — Start the dApp

```bash
pnpm web
```

Open [http://localhost:3000](http://localhost:3000). The dApp will connect to Sepolia automatically when MetaMask is on the Sepolia network.

Verify your deployment on [Sepolia Etherscan](https://sepolia.etherscan.io) by searching for your deployer address.

<br/>

## 🔄 End-to-End User Flow

Once deployed, this is the complete lifecycle:

```
PlatformAdmin
  └─► deploys PayrollConfidentialWrapper + PayrollFactoryRegistry

Employer
  ├─► connects wallet on /employer
  ├─► calls registerCompany() → receives dedicated Payroll contract
  ├─► approves USDC to Wrapper
  ├─► wraps USDC into cpUSD
  ├─► grants Payroll contract operator approval
  ├─► adds employees (wallet addresses)
  ├─► sets encrypted salary per employee (FHE-encrypted euint64)
  └─► runs payroll batch → confidential transfers execute

Employee
  ├─► connects wallet on /employee
  ├─► platform auto-discovers their employment binding from Supabase
  ├─► decrypts own salary and last payment in the private portal
  ├─► approves Payroll contract as wrapper operator
  └─► calls requestUnwrap() → receives plain USDC in their wallet
```

<br/>

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Ethereum · Solidity `^0.8.27` · fhEVM (Zama) |
| **FHE** | `@fhevm/solidity` · `@zama-fhe/relayer-sdk` · `euint64` encrypted types |
| **Token Standard** | ERC-7984 (OpenZeppelin Confidential Contracts) |
| **Contract tooling** | Hardhat · hardhat-deploy · TypeChain · solhint · solidity-coverage |
| **Frontend** | Next.js 15 · React 19 · TypeScript |
| **Blockchain client** | wagmi v2 · viem · @tanstack/react-query |
| **UI** | Tailwind CSS v4 · Radix UI · Geist Mono |
| **Off-chain DB** | Supabase (PostgreSQL) · Row Level Security |
| **Crypto (off-chain)** | AES-256-GCM · HMAC-SHA256 (Node.js `crypto`) |
| **Monorepo** | pnpm workspaces |

<br/>

## 📄 Additional Documentation

| Document | Description |
|---|---|
| [BUSINESS.md](./BUSINESS.md) | Business model, revenue tiers, GTM strategy, competitive analysis |
| [GDPR.md](./GDPR.md) | Full GDPR compliance assessment with Article references |
| [SECURITY.md](./SECURITY.md) | Threat model, attack class analysis, security controls |

<br/>

## 🚨 Reporting a Vulnerability

If you discover a security issue, please report it **privately** before public disclosure.

Include in your report:
- Affected layer (contract / API route / frontend) and specific function or route
- Description of the issue
- Impact assessment (fund loss / PII exposure / DoS / privacy leakage)
- Reproduction steps
- Suggested fix (if available)

Allow maintainers time to reproduce, patch, and coordinate a release before publishing exploit details.

<br/>

---

<div align="center">

<br/>

Built with ❤️ for the [Zama Special Bounty](https://www.zama.ai/) · February 2026

<br/>

[![Zama](https://img.shields.io/badge/Powered%20by-Zama%20fhEVM-FFD208?style=flat-square&labelColor=000000)](https://www.zama.ai/)
[![OpenZeppelin](https://img.shields.io/badge/Secured%20by-OpenZeppelin-FFD208?style=flat-square&labelColor=000000)](https://www.openzeppelin.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-FFD208?style=flat-square&labelColor=000000)](https://supabase.com/)

<br/>

*Paychain — Where salaries are secrets, by mathematics.*

<br/>

</div>
