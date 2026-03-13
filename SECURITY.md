# Security Policy

## Overview

This repository contains a confidential payroll system built across three layers:

- **Smart contracts**: `Payroll.sol`, `PayrollFactoryRegistry.sol`, `PayrollConfidentialWrapper.sol`
- **Backend API** (`/api/company/...`, `/api/employee/...`): server-side routes using a Supabase service-role key
- **Frontend** (`apps/web`): Next.js client, wagmi, FHE browser SDK

The system uses **FHE (Fully Homomorphic Encryption)** for on-chain salary/payment confidentiality and **AES-256-GCM field-level encryption** for off-chain personal identity data stored in Supabase.

---

## Security posture summary

### What is protected well
- **Encrypted salary/payment values on-chain** (FHE handles, never plaintext)
- **PII encrypted at rest in Supabase** (AES-256-GCM per field, server-side only)
- **HMAC-based searchable fields** (DNI lookup without decryption)
- **Access-controlled payroll actions** (`EMPLOYER_ROLE`)
- **Service-role key isolated to server** (no direct DB client access from browser)
- **Duplicate payment protection per employee/per period**
- **Cascade delete** of all employee records on removal (supports right to erasure)
- **Reentrancy hardening** on sensitive contract functions
- **Batch size limits** to reduce gas-related DoS risk

### Important limitations
- This is **not a formal audit**
- Smart contract security depends on ERC-7984 token implementation, FHEVM/Zama semantics, deployment configuration, and key/admin operational security
- **Blockchain metadata remains public** (addresses, calldata, events) even if amounts are encrypted
- The encryption key (`IDENTITY_ENCRYPTION_KEY`) is a critical secret — its compromise exposes all stored PII

---

## Threat model (high-level)

### In scope
- Unauthorized payroll execution
- Duplicate payroll payments
- Unauthorized access to employee PII in Supabase
- Common smart contract attack classes (reentrancy, access control bypass, DoS, etc.)
- Logic flaws in payroll period locking and fund movement
- API route authorization and data isolation between companies

### Out of scope (for this document)
- Formal FHE cryptographic proofs
- Key management / KMS / HSM security
- Legal/regulatory compliance (GDPR/RGPD, labor/tax law)
- Third-party infrastructure security (RPC providers, wallet vendors, relayers, Supabase hosting)

---

## Smart contract attack classes

### 1) Reentrancy
**Status: Mitigated (defense-in-depth)** ✅

- Sensitive functions are role-protected (`onlyRole(EMPLOYER_ROLE)`)
- `ReentrancyGuard` applied to externally callable sensitive functions (payroll execution, employee lifecycle)
- State updates for duplicate-period protection applied after successful transfer

**Residual risk**: External dependencies (`token`, `registry`) remain trust boundaries.

---

### 2) Access control bypass / privilege escalation
**Status: Mitigated in code** ✅ / **Operational risk remains** ⚠️

- Sensitive functions use OpenZeppelin `AccessControl`
- Payroll execution/admin actions require `EMPLOYER_ROLE`
- Registry hooks validate expected callers

**Residual risk**: Compromise of an admin/employer key leads to full privileged control.

**Recommendation**: Use hardware wallets / multisig for admin roles in production.

---

### 3) Duplicate payment / replay of payroll periods
**Status: Mitigated** ✅

- Payment tracked per employee/per run ID (`_paidInRun[employee][runId]`)
- Run IDs are computed as `keccak256(companyRef, periodId)` on the frontend — opaque on-chain, preventing semantic period inference
- Prevents duplicate payment even if periods are non-consecutive

---

### 4) Front-running / MEV
**Status: Low direct exploitability** ✅ / **Metadata exposure remains** ⚠️

- Payroll functions are role-restricted; outsiders cannot copy payroll calls
- No public mint/withdraw logic in payroll contract

**Residual risk**: Transaction calldata/events reveal metadata (employee addresses, run IDs, timing). Primarily a privacy concern rather than a direct fund exploit.

---

### 5) Integer overflow / underflow
**Status: Mitigated by compiler** ✅

Solidity `^0.8.x` includes built-in checked arithmetic.

---

### 6) Denial of service via unbounded loops / gas exhaustion
**Status: Partially mitigated** ⚠️

- `MAX_BATCH_SIZE` cap on batch payroll
- Roster enumeration moved off-chain to Supabase (no on-chain employee array iteration)

**Residual risk**: Large roster batch payroll calls may approach gas limits at scale.

---

### 7) `tx.origin` phishing
**Status: Mitigated** ✅

Authorization is role-based and does not rely on `tx.origin`.

---

### 8) Signature replay / incorrect signature verification
**Status: Not applicable** ✅

Contracts do not implement custom EIP-712 or signature-based authorization flows.

---

### 9) Oracle / price manipulation
**Status: Not applicable** ✅

Payroll contracts do not depend on price oracles.

---

### 10) Delegatecall / proxy upgrade storage collision
**Status: Not applicable (current design)** ✅

Contracts are not deployed via proxy/delegatecall upgrade patterns. If upgradeability is introduced later, a fresh review is required.

---

### 11) Malicious token / external dependency behavior
**Status: Partially mitigated / trust-based** ⚠️

- Token interactions constrained by expected ERC-7984-compatible interface and operator checks
- Security depends on the actual deployed confidential token implementation

**Recommendation**: Treat token + FHE libraries as critical dependencies. Pin versions and audit dependency upgrades.

---

### 12) Unauthorized fund source (delegated operator payer confusion)
**Status: Mitigated** ✅

- Payroll execution pulls funds from the canonical `employer` address, not `msg.sender`
- Delegated operators can execute payroll only if they have `EMPLOYER_ROLE`, but payment source always remains the employer wallet

---

### 13) Stale state reuse after employee removal/re-activation
**Status: Partially mitigated** ✅

- Employee removal clears salary/last payment state in the contract
- Supabase cascade delete removes all associated records (employment_chain_binding → employment → person_wallet → person_identity → person)
- On-chain historical calldata remains immutable

---

### 14) Event-based data leakage / on-chain metadata privacy exposure
**Status: Not fully mitigated (design limitation)** ⚠️

Blockchain transactions and events are public by nature. Employee addresses, payroll timing, and company linkages remain inferable. See GDPR.md for compliance implications.

**Recommendation**: Minimize identifying events. Move all identity and employment-linking data off-chain (currently done via Supabase).

---

### 15) Emergency controls / pause mechanism
**Status: Not implemented** ⚠️

No dedicated pause mechanism exists. Emergency response relies on role revocation and operator expiry.

**Recommendation**: Consider adding `Pausable` with careful governance. Document emergency procedures: revoke `EMPLOYER_ROLE`, revoke token operator approval, rotate admin credentials.

---

## Backend / API security

### 16) Direct database access from browser
**Status: Mitigated** ✅

- All sensitive reads and writes go through Next.js API routes (`/api/company/...`, `/api/employee/...`)
- API routes use `supabaseAdmin` (service-role key), which is never exposed to the browser
- The browser-side `database` client (anon/publishable key) is no longer used for any sensitive operation
- Supabase Row Level Security (RLS) provides a second layer of defense even if the anon key is misused

---

### 17) PII stored in plaintext in Supabase
**Status: Mitigated** ✅

All personal identity fields in `person_identity` are encrypted server-side before storage:

| Field | Protection |
|---|---|
| `given_name_enc` | AES-256-GCM, server-side |
| `family_name_enc` | AES-256-GCM, server-side |
| `dni_value_enc` | AES-256-GCM, server-side |
| `email_enc` | AES-256-GCM, server-side |
| `dni_search_hmac` | HMAC-SHA256 (allows lookup without decryption) |

The encryption key (`IDENTITY_ENCRYPTION_KEY`, 32 bytes / 64 hex chars) and HMAC secret (`IDENTITY_HMAC_SECRET`) are environment variables **never committed to source control and never sent to the browser**.

**Residual risk**:
- Compromise of `IDENTITY_ENCRYPTION_KEY` exposes all stored PII
- The key is currently a static environment variable — production deployments should use a KMS (AWS KMS, GCP Cloud KMS, HashiCorp Vault, etc.) with key rotation
- Server logs must not record decrypted PII

**Recommendation**:
- Rotate `IDENTITY_ENCRYPTION_KEY` periodically using the `encryption_key_ref` column (designed for this purpose)
- Store the key in a secrets manager, not in `.env` files in production
- Audit which API routes can trigger decryption and log access with purpose

---

### 18) Company data isolation — cross-company data leakage
**Status: Mitigated** ✅ / **Cryptographic proof pending SIWE** ⚠️

**Implemented**: All company-scoped API routes now perform a server-side ownership check before returning or modifying any data.

The check is centralised in `apps/web/lib/apiAuth.ts` to verify the current employer's wallet coincides with the employer's wallet stored in Supabase.

All three company-scoped routes now call this before touching any data:
- `/api/company/roster` — reads the `x-employer-wallet` header, verified before returning roster
- `/api/company/remove-employee` — resolves the binding's `company_onchain_binding_id` first, then verifies
- `/api/company/register-employee` — verifies before creating any records

The frontend sends the connected wallet on every call via `supabasePayroll.ts` with the `x-employer-wallet` Header.

**What this prevents**: An employer who discovers another company's `company_onchain_binding_id` UUID cannot query their roster, delete their employees, or register new employees under their binding. Every request is checked against `company_onchain_binding.employer_wallet_address` in the database.

**Residual risk**: The `x-employer-wallet` header is self-reported by the client — the server verifies it matches the database record, but does not cryptographically prove the HTTP caller controls that wallet. A compromised browser session that has access to the correct wallet address string could still forge the header.

**Recommended next step**: Implement **SIWE (Sign-In With Ethereum)** session tokens — the user signs a nonce with their wallet once on login, the server issues a session cookie, and all subsequent API requests are authenticated via that session rather than a self-reported header. This closes the remaining gap.

---

### 19) Employee registration — incomplete or corrupted records
**Status: Mitigated (partially)** ✅ / **Atomicity risk remains** ⚠️

The `/api/company/register-employee` route creates records in strict dependency order:
`person` → `person_identity` → `person_wallet` → `employment` → `employment_chain_binding`

If any step fails, the route attempts to roll back by deleting the `person` record (which cascades via FK constraints).

**Residual risk**: The rollback is best-effort. A failure between steps 4 and 5 could leave orphaned `person_wallet` or `employment` records that are not linked to an `employment_chain_binding`. These are invisible to the roster but consume storage.

**Recommendation**: Wrap the entire registration in a Supabase database function (PL/pgSQL transaction) to guarantee atomicity. This is the correct fix for multi-step inserts.

---

### 20) Cascade delete — unintended data loss
**Status: Accepted risk with safeguard** ✅

The `/api/company/remove-employee` DELETE route removes records in strict FK order:
`employment_chain_binding` → `employment` → `person_wallet` → `person_identity` → `person`

The `person` record is only deleted if the person has no remaining employments or wallets (i.e., they are not employed at other companies). This prevents accidental deletion of shared-identity records.

**Residual risk**: There is no soft-delete / recycle bin. Once deleted, records are gone. The on-chain `removeEmployee()` call is irreversible.

**Recommendation**: Consider adding a `deleted_at` soft-delete column and a periodic hard-delete job, rather than immediate hard deletion. This also aids GDPR Article 30 audit trail requirements.

---

## What security controls exist today (summary)

| Layer | Control |
|---|---|
| On-chain | Role-based access control (OpenZeppelin AccessControl) |
| On-chain | FHE encrypted salary/payment values |
| On-chain | Per-run duplicate payment lock |
| On-chain | Canonical employer payer semantics |
| On-chain | Operator approval checks before token transfers |
| On-chain | Reentrancy guard on sensitive functions |
| On-chain | Batch size cap |
| Off-chain | AES-256-GCM field-level encryption for all PII |
| Off-chain | HMAC-SHA256 for searchable fields (no plaintext lookup) |
| Off-chain | All mutations via server-side API routes (service-role key) |
| Off-chain | Cascade delete enabling right to erasure |
| Off-chain | `encryption_key_ref` column for future key rotation |

---

## Security best practices for deployment and operations

### Key management
- Store `IDENTITY_ENCRYPTION_KEY` and `IDENTITY_HMAC_SECRET` in a secrets manager (not `.env` files) in production
- Use a **hardware wallet** or **multisig** for `DEFAULT_ADMIN_ROLE` on-chain
- Rotate compromised keys immediately; use `encryption_key_ref` to track which key version encrypted each record
- Never log decrypted PII values on the server

### Role management
- Grant `EMPLOYER_ROLE` only to trusted payroll operators
- Periodically review and revoke unused access
- Implement SIWE (Sign-In With Ethereum) for server-side API authentication

### Token/operator controls
- Keep operator approvals short-lived
- Revoke operator approval during incidents or maintenance
- Verify the deployed confidential token address is the expected audited implementation

### Monitoring and alerting
- Monitor payroll executions, role changes, and registry changes on-chain
- Monitor API route access patterns in server logs (rate limiting, unusual bulk reads)
- Alert on: unusual batch sizes, repeated failed payroll attempts, unexpected role grants, operator approval changes, bulk employee deletions

### Testing and assurance
- Maintain regression tests for: duplicate period prevention, delegated operator payer behavior, batch size limits, role restrictions, API route authorization
- Add fuzz/invariant tests before production deployment
- Consider an independent external audit before mainnet use

---

## Reporting a vulnerability

If you discover a security issue, please report it privately to the maintainers before public disclosure.

### Suggested report contents
- Affected layer (contract / API route / frontend) and specific function/route
- Description of the issue
- Impact assessment (fund loss / PII exposure / denial of service / privacy leakage)
- Reproduction steps or proof of concept
- Suggested fix (if available)

### Disclosure policy
- Allow maintainers time to reproduce, patch, and coordinate a release before public disclosure
- Do not publish exploit details for unpatched issues

---

## Disclaimer

This document summarizes known attack classes and current protections, but is **not a formal security audit** and **does not guarantee absence of vulnerabilities**. Production deployment should include an independent audit, extended testing (including fuzzing/invariants), secure key management, and operational monitoring.