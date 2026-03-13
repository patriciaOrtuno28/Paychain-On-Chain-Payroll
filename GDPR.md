# GDPR Compliance

The GDPR applies to this project as it processes personal data (any information about an identified or identifiable natural person), carries out processing (collecting, storing, consulting, using, communicating, deleting, etc.) and it is within the material and territorial scope of the GDPR (processing activities relate to EU individuals and employment relationships).

---

## Main principles of the GDPR (Article 5)

1. **Lawfulness, fairness and transparency**
2. **Purpose limitation**: using data only for specific, explicit and legitimate purposes
3. **Data minimisation**: only collect what is strictly necessary
4. **Accuracy**: correct and up-to-date data
5. **Storage limitation**: do not store longer than necessary
6. **Integrity and confidentiality**: adequate security measures
7. **Proactive accountability**: not only comply, but be able to demonstrate compliance

---

## Legal basis for processing (Article 6)

Payroll processing in an employment context is primarily grounded in:

- **Article 6(1)(b)** — Performance of a contract (the employment contract requires payroll execution)
- **Article 6(1)(c)** — Legal obligation (employers are legally required to pay, withhold taxes, report to authorities)
- **Article 9(2)(b)** — Processing special category data (e.g. national ID numbers) necessary for employment law obligations

Consent is **not** the appropriate legal basis for payroll processing — it would not be freely given in an employment relationship (power imbalance). Do not rely on employee consent for core payroll data.

---

## Prohibited data categories (Article 9)

The system must never collect or store:
- Racial or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Genetic data
- Biometric data used for unique identification
- Health data (beyond what is legally required for payroll deductions)
- Sexual life or sexual orientation

The `person_identity` schema fields (`given_name`, `family_name`, `dni_type`, `dni_value`, `email`) are appropriate for payroll. No Article 9 data is collected in the current design.

---

## Current compliance status

### ✅ Compliant / Significantly improved

#### 1. PII encrypted at rest in Supabase (NEW)
All personal identity fields in `person_identity` are now encrypted server-side before storage using **AES-256-GCM**:

| Field | Treatment |
|---|---|
| `given_name` | Encrypted (`given_name_enc`) |
| `family_name` | Encrypted (`family_name_enc`) |
| `dni_value` | Encrypted (`dni_value_enc`) |
| `email` | Encrypted (`email_enc`) |
| `dni_search_hmac` | HMAC-SHA256 (enables lookup without decryption) |

Encryption/decryption happens exclusively in server-side API routes using a key that never reaches the browser. This satisfies **Article 25 (privacy by design)** and **Article 32 (security of processing)** at the data layer.

---

#### 2. Salary and payment amounts encrypted on-chain
In `Payroll.sol`, salaries and last payments are stored as FHE-encrypted values (`euint64`) and decrypted only for authorized parties via FHE ACLs. Amounts are never stored or transmitted in plaintext. Strong **Article 25** and **Article 32** signal.

---

#### 3. All PII flows through server-side API routes only (NEW)
The browser client (`database.ts`) no longer performs any direct read or write of personal data. All sensitive operations go through Next.js API routes that use the Supabase service-role key:

- `/api/company/register-employee` — creates person + identity + wallet + employment
- `/api/company/roster` — reads employment roster (no PII decryption)
- `/api/company/remove-employee` — cascade deletes all records
- `/api/employee/bindings` — discovery of employment relationships

This enforces server-side access control and enables audit logging at the API layer.

---

#### 4. Right to erasure (Article 17) — cascade delete implemented (NEW)
Employee removal now performs a full cascade delete of all Supabase records:

```
employment_chain_binding → employment → person_wallet → person_identity → person
```

The `person` record is only deleted if the person has no remaining employments at other companies, preventing unintended data loss for multi-employer relationships.

**Caveat**: On-chain calldata and events are immutable and cannot be erased — see remaining non-compliance section below.

---

#### 5. Role-based access control
Employer-only views and employee self-views are separated both in the smart contract (`EMPLOYER_ROLE`, employee self-view functions) and in the API layer (routes scoped to employer wallet). Good least-privilege design.

---

#### 6. No analytics/trackers in the frontend
Google Analytics, Meta Pixel, and similar third-party tracking scripts are absent. This reduces the compliance surface and the need for cookie consent banners for tracking purposes.

---

#### 7. `encryption_key_ref` enables key rotation (NEW)
The `person_identity` table stores an `encryption_key_ref` column alongside each encrypted record, referencing which key version was used. This enables future key rotation (re-encryption with a new key) without losing the ability to decrypt existing records during the transition window. This is a requirement of **Article 32** for long-lived data.

---

### ⚠️ Partially compliant / Mitigated but residual risk remains

#### 8. Employment relationships partially exposed on-chain
The registry and payroll contracts necessarily involve wallet addresses:
- `company_onchain_binding` stores `employer_wallet_address` and `payroll_contract_address`
- `addEmployee(address)` / `removeEmployee(address)` calldata is public
- Payroll execution calldata references employee wallet addresses

Wallet addresses **can constitute personal data** in an employment context (they are linked to identifiable individuals). This creates tension with **Article 5(1)(c) data minimisation** and **Article 5(1)(f) confidentiality**.

**Current mitigation**: All identity data (names, DNI, email) is stored only in Supabase (encrypted). On-chain data is reduced to the minimum needed for fund movement (wallet addresses). The run ID system (`keccak256(companyRef, periodId)`) makes period IDs opaque on-chain.

**Residual non-compliance**: The wallet address → employment relationship linkage on-chain cannot be fully eliminated given the technical requirements of confidential token transfers.

---

#### 9. Payroll metadata leakage via events
Even with encrypted amounts, on-chain events reveal:
- Employment status changes (add/remove timing)
- Payroll execution timing and cadence
- Active/inactive workforce patterns

This is still HR metadata and is sensitive in employment contexts, creating tension with **Article 5(1)(f)**.

**Current mitigation**: The `PayrollRunExecuted` event emits only `runId` and `employeeCount`, not individual addresses. No `EmployeeAdded`/`EmployeeRemoved` events are emitted in the current `Payroll.sol` design.

**Residual non-compliance**: `addEmployee`/`removeEmployee` calldata is still public on the blockchain.

---

#### 10. Immutability vs. storage limitation and rectification
Blockchain state, calldata, and events are immutable by design. This creates structural tension with:
- **Article 5(1)(e)** storage limitation
- **Article 16** right to rectification
- **Article 17** right to erasure

**Current mitigation**: All personal identity data is stored off-chain in Supabase where it can be corrected and deleted. The cascade delete implementation addresses erasure for off-chain data.

**Residual non-compliance**: Wallet address → employer/payroll relationships recorded on-chain cannot be erased.

---

#### 11. API route ownership verification
**Status: Mitigated** ✅ / **Cryptographic proof pending SIWE** ⚠️

All company-scoped API routes now perform a server-side database ownership check via `lib/apiAuth.ts`. Every request to `/api/company/roster`, `/api/company/remove-employee`, and `/api/company/register-employee` must include an `x-employer-wallet` header, which is verified against `company_onchain_binding.employer_wallet_address` before any data is read or modified. A non-matching wallet receives a `403 Forbidden`.

This satisfies **Article 5(1)(f) integrity and confidentiality** and **Article 25 privacy by default** at the API layer — one employer's data cannot be accessed by supplying a different company's UUID.

**Residual risk for GDPR purposes**: The wallet address in the header is self-reported by the browser. Without SIWE session tokens, the server cannot cryptographically prove the caller controls that wallet. Until SIWE is implemented, this is a database-level check, not a cryptographic proof of identity. This is relevant to **Article 32** (appropriate technical measures) — the check is present and effective against the most likely attack vectors (UUID enumeration), but is not the strongest possible authentication.

---

### ❌ Not compliant / Requires action

#### 12. Missing GDPR governance documentation
The following are required under GDPR and are not yet implemented:

| Requirement | Article | Status |
|---|---|---|
| Privacy notice for employees | Art. 13 | ❌ Missing |
| Legal basis documentation | Art. 6 | ❌ Missing |
| Records of processing activities (RoPA) | Art. 30 | ❌ Missing |
| Data subject rights workflow (access, rectification, erasure, restriction, objection) | Arts. 15–22 | ❌ Missing |
| Retention schedule | Art. 5(1)(e) | ❌ Missing |
| Data processor agreements (Supabase, RPC provider, Zama relayer) | Art. 28 | ❌ Missing |
| Data breach response process | Arts. 33–34 | ❌ Missing |
| DPIA | Art. 35 | ❌ Required — see below |

---

#### 13. DPIA likely required (Article 35)
A **Data Protection Impact Assessment** is almost certainly required before production deployment. The following DPIA triggers apply:

- Systematic processing of employee personal data at scale
- Use of new technology (FHE, blockchain)
- Processing data that cannot be erased (immutable ledger)
- Cross-border data flows (Supabase hosting region, RPC providers, Zama relayer)
- Special category adjacent data (national ID numbers used for payroll)

A DPIA must be completed before the system processes real employee data in the EU.

---

#### 14. Third-party processors require compliance controls (Article 28)
The application relies on external infrastructure that may process personal data (wallet addresses, IP addresses, signatures, metadata):

| Processor | Data involved | Required action |
|---|---|---|
| Supabase | All Supabase-stored data | Art. 28 DPA (check Supabase's DPA, verify hosting region) |
| RPC provider (Infura/Alchemy) | Wallet addresses, transaction metadata, IP | Art. 28 DPA, international transfer assessment |
| Zama relayer SDK | Wallet address, signatures, decryption requests | Art. 28 DPA if operated by third party |
| CDN (fonts, scripts) | IP address, browser metadata | Assess necessity; consider self-hosting |

For any processor outside the EEA: verify adequacy decision, SCCs, or BCRs apply.

---

#### 15. Frontend decryption of employee salary lacks audit trail (Article 5(2) accountability)
The employer UI allows decrypting selected employee salary and last payment, displaying the values in the browser. GDPR accountability principles require:

- **Access justification / audit log**: Who accessed which employee's salary, when, and for what purpose
- **Inactivity timeout**: Decrypted values should not persist indefinitely in the UI
- **Minimal disclosure**: Consider showing only what is needed (e.g. not raw base units by default)

**Recommendation**: Log all decryption events server-side (not in the browser) with actor wallet, target employee binding ID, timestamp, and declared purpose. This supports **Article 5(2)** accountability and future DSR responses.

---

#### 16. Data subject rights workflow not implemented (Articles 15–22)
Employees have the right to:
- **Access** (Art. 15): obtain a copy of their data
- **Rectification** (Art. 16): correct inaccurate data
- **Erasure** (Art. 17): delete their data (now technically possible for off-chain data)
- **Restriction** (Art. 18): limit processing
- **Portability** (Art. 20): receive data in machine-readable format
- **Objection** (Art. 21): object to processing

The cascade delete implementation addresses the technical capability for erasure, but there is no workflow for employees to submit and track data subject requests (DSRs). The `data_subject_request` table exists in the schema but has no associated UI or handling logic.

**Recommendation**: Build a minimal DSR intake form for employees, backed by the existing `data_subject_request` table, with employer notification and a resolution workflow.

---

## Privacy by design checklist (Article 25)

| Requirement | Status |
|---|---|
| Encrypt PII at rest | ✅ AES-256-GCM for all person_identity fields |
| Encrypt amounts on-chain | ✅ FHE (euint64) |
| Minimise on-chain personal data | ✅ Only wallet addresses on-chain |
| Server-side key isolation | ✅ Encryption key never reaches browser |
| Support erasure (technical capability) | ✅ Cascade delete implemented |
| Key rotation support | ✅ encryption_key_ref column |
| Restrict access by role | ✅ Contract EMPLOYER_ROLE + API route scoping + ownership check |
| No third-party trackers | ✅ None present |
| Audit trail for PII access | ❌ Not implemented |
| Employee consent / privacy notice | ❌ Not implemented |
| DSR workflow | ❌ Not implemented (table exists, no UI/logic) |
| DPIA completed | ❌ Required before production |
| Art. 28 DPAs with processors | ❌ Required |

---

## Recommended next steps (priority order)

1. **Complete DPIA** before any real employee data is processed
2. **Add audit logging** for all PII access (decryption events, roster reads, DSR actions)
3. **Build DSR intake workflow** using the existing `data_subject_request` table
4. **Draft privacy notice** for employees (Art. 13) explaining what is collected, why, for how long, and their rights
5. **Sign Art. 28 DPAs** with Supabase, RPC provider, Zama relayer
6. **Move encryption key to KMS** — remove static `IDENTITY_ENCRYPTION_KEY` env var in production
7. **Document legal basis and RoPA** (Art. 30) for all processing operations
8. **Add retention schedule** and automated deletion of stale records
9. **Consider soft-delete** before hard-delete for a minimum retention/audit window
10. **Implement SIWE** to upgrade API authentication from database-level ownership check to cryptographic proof of wallet control