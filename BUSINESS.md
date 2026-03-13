# Paychain — Confidential Payroll-as-a-Service

> *The first payroll platform where salaries are mathematically private — not just policy-private.*

---

## What we do

Paychain lets companies pay employees in stablecoins (USDC) with full salary confidentiality on-chain. Salary amounts are encrypted using Fully Homomorphic Encryption (FHE) — meaning they cannot be read by anyone on the blockchain, not even the network validators. Only the employer and the receiving employee can decrypt their own data.

This is fundamentally different from traditional crypto payroll tools, which broadcast every salary in plaintext to a public ledger.

---

## The problem we solve

### For employers
Every company running payroll in crypto today has the same problem: **salaries are public**. Any competitor, employee, journalist, or regulator can go to Etherscan and see exactly what every employee earns, when they were paid, and when they left the company. This is not a theoretical risk — it has happened repeatedly.

Beyond transparency, HR teams face:
- **GDPR exposure** from storing payroll data in unencrypted SaaS tools
- **Compliance friction** from multi-jurisdiction payroll with no audit trail
- **Treasury inefficiency** from holding funds in custodial payroll processors

### For employees
Employees in crypto-native companies today have no private portal to verify their salary history, check payment receipts, or exercise data rights. They have to trust their employer's spreadsheet.

---

## Our solution

| Feature | Traditional crypto payroll | Paychain |
|---|---|---|
| Salary visibility on-chain | Public plaintext | FHE-encrypted, unreadable |
| Employee PII storage | Plaintext in SaaS DB | AES-256-GCM encrypted at rest |
| Employer custody of funds | Custodial (you send to us) | Non-custodial (operator approval only) |
| Employee self-service | None | Private decryption portal |
| GDPR compliance | Partial | By design (cascade delete, encryption, audit trail) |
| Duplicate payment protection | Manual | Enforced on-chain per pay run |

---

## Who we sell to

### Primary: Crypto-native companies (web3 SMEs)
DAOs, DeFi protocols, NFT studios, blockchain infrastructure companies, and web3 agencies that:
- Already pay some or all employees in stablecoins
- Have 5–200 employees
- Are incorporated (often in Switzerland, BVI, Cayman, UAE, Estonia, or Delaware)
- Are acutely aware that their on-chain treasury is public

This market is **immediately addressable** — they already have the wallet infrastructure and stablecoin treasury. The friction to onboard is low.

**Estimated addressable companies today**: ~15,000–40,000 globally (conservative estimate based on active DAO treasuries + registered web3 companies)

### Secondary: Traditional companies going on-chain
Traditional SMEs (50–500 employees) in high-privacy jurisdictions (Germany, France, Spain, Switzerland) that:
- Want to experiment with stablecoin payroll
- Have strict GDPR obligations and fear the compliance exposure of public payroll data
- Are exploring blockchain payroll for cross-border remote teams

This segment requires more education but has **larger deal sizes** and more regulatory urgency.

### Tertiary: Payroll bureaus and accountancy firms
Firms that manage payroll for multiple client companies. A single bureau relationship can unlock 10–50 companies at once. We offer a white-label or partner tier for this segment.

---

## Revenue model

### Core model: Per-employee per-month (PEPM)

This is the industry standard for payroll SaaS (Gusto, Rippling, Deel all use it) and aligns our revenue directly with the value we deliver. The employer pays monthly based on their active headcount.

| Tier | Price | Included |
|---|---|---|
| **Starter** | €8 / employee / month | Up to 10 employees, monthly cadence, standard support |
| **Growth** | €12 / employee / month | Up to 100 employees, all cadences, priority support, audit log export |
| **Scale** | €18 / employee / month | Unlimited employees, multi-contract, SLA, dedicated onboarding |
| **Enterprise** | Custom | White-label, custom chain, compliance package, legal DPAs |

A company with 20 employees on Growth = **€240/month = €2,880/year** per customer.

**Why not charge per transaction?** Per-transaction pricing creates perverse incentives — employers delay payroll runs to save money. PEPM aligns incentives: we want them to run payroll reliably every period.

### Add-on: Gas sponsorship
Employers currently need ETH to pay gas. We can abstract this entirely by sponsoring gas on their behalf (using ERC-4337 account abstraction or a relayer) and billing it as a flat add-on:

- **€2 / employee / month** flat gas coverage (we absorb the gas cost and margin it)

This removes the biggest friction point for non-crypto-native employers who don't want to manage ETH.

### Add-on: Compliance package
- **€99/month flat** — GDPR audit log exports, DSR workflow management, data retention scheduling, Art. 30 RoPA template generation

Targeted at EU companies with a DPO or legal team asking questions.

### Add-on: Multi-chain deployment
- **€49/month** — deploy the employer's payroll contract on an additional chain (e.g. Polygon, Base, Arbitrum in addition to Ethereum mainnet)

---

## Pricing rationale

The comparable products in traditional payroll SaaS:
- **Gusto** (US): $6–$12/employee/month
- **Deel** (global): $19–$49/employee/month for contractors
- **Rippling** (US): $8/employee/month base

We are priced at a slight premium to reflect the confidentiality guarantee and GDPR-by-design architecture, but below Deel because our initial focus is crypto-native companies that are already comfortable with the on-chain setup.

---

## Go-to-market

### Phase 1 — Community-led (months 1–6)
Target: DAOs and web3 protocols

The web3 community is small and word-of-mouth driven. A single high-profile DAO publicly announcing they use Paychain for salary privacy is worth more than any paid campaign.

- **Zama bounty / hackathon presence** → technical credibility, developer discovery
- **DAO governance forums** (Uniswap, Aave, Gitcoin, ENS) → post about the salary privacy problem
- **Twitter/X and Farcaster** → content around "your competitor can see your salaries on Etherscan"
- **Etherscan / on-chain analytics** → sponsored content showing salary exposure of known protocols
- **Free tier or 60-day trial** for the first 20 companies → generate case studies

### Phase 2 — Partner-led (months 6–18)
Target: Payroll bureaus, crypto accountancy firms

- Partner program for accountancy firms that manage web3 client payrolls
- Revenue share: 20% of MRR for clients they bring in
- Integration with existing crypto accounting tools (Cryptio, Gilded, Request Finance)

### Phase 3 — Enterprise and regulated markets (18 months+)
Target: Traditional companies in Germany, France, Spain, Switzerland

- Requires legal opinion on employment law compliance per jurisdiction
- Requires formal security audit of smart contracts
- Sell through HR software integrations (BambooHR, Factorial, HiBob)

---

## Key differentiators to communicate

**1. "Etherscan-proof payroll"**
This is the one-liner. Every potential customer who has googled their own company's Ethereum address and seen their payroll broadcast publicly will immediately understand the value.

**2. Non-custodial**
We never hold the employer's money. The employer's USDC stays in their wallet and is transferred directly to employees via an operator approval. This is a significant trust advantage over custodial payroll processors.

**3. GDPR by design, not by policy**
The data is mathematically protected, not just contractually protected. This is a verifiable claim that legal teams can appreciate.

**4. Auditable by the right people, invisible to everyone else**
The employer and employee can always decrypt their own data. Regulators can be granted access. No one else can read anything.

---

## Competitive landscape

| Competitor | Type | Salary privacy | Non-custodial | GDPR | Notes |
|---|---|---|---|---|---|
| **Request Finance** | Crypto invoicing/payroll | ❌ Public on-chain | ✅ | Partial | No encryption, salaries visible |
| **Deel** | Global HR/payroll | ✅ (off-chain only) | ❌ Custodial | ✅ | No on-chain component |
| **Bitwage** | Bitcoin/USDC payroll | ❌ | ❌ | Partial | Legacy product, no privacy |
| **Coinshift** | Treasury + payroll | ❌ | ✅ | Partial | Multi-sig focused, no salary privacy |
| **Superfluid** | Streaming payments | ❌ Fully public | ✅ | ❌ | Real-time but zero privacy |

**No existing product combines on-chain execution with encrypted salary confidentiality.** This is the white space Paychain occupies.

---

## Unit economics (illustrative)

| Metric | Conservative | Base case | Optimistic |
|---|---|---|---|
| Customers at 12 months | 30 | 80 | 200 |
| Avg employees per customer | 15 | 20 | 25 |
| Avg revenue per employee | €10 | €12 | €14 |
| **MRR at 12 months** | **€4,500** | **€19,200** | **€70,000** |
| **ARR at 12 months** | **€54,000** | **€230,400** | **€840,000** |

Churn assumption: 3%/month (typical for SME SaaS). Key driver of upside is landing a single large DAO (50+ contributors) early.

---

## What we need to get to market

### Must-have before first paying customer
- [ ] SIWE authentication (wallet-signed sessions)
- [ ] Mainnet deployment (Ethereum or L2 with FHE support)
- [ ] Smart contract audit
- [ ] Privacy notice and Terms of Service
- [ ] Art. 28 DPA with Supabase
- [ ] DPIA completed
- [ ] Gas sponsorship or clear ETH onboarding guide

### Nice-to-have for growth
- [ ] FIAT on-ramp integration (employer buys USDC directly in-app)
- [ ] Payslip PDF export (encrypted, downloadable by employee)
- [ ] Multi-currency support (EURC, EURS alongside USDC)
- [ ] Webhook/API for integration with HR tools
- [ ] Mobile app for employee portal

---

## What is stored where

- **On-chain**: only what is strictly necessary to move confidential funds — wallet addresses, encrypted salary handles, run IDs
- **Supabase**: company identity, employment relationships, encrypted PII (AES-256-GCM), payroll periods, audit logs, DSR workflows
- **Nowhere**: plaintext salaries, plaintext names/DNI/email (only encrypted forms are stored)