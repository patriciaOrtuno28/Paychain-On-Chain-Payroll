import type { Address } from "viem";

// NOTE: This file must only use fetch() to API routes — no direct database client calls.
// All company-scoped routes require the x-employer-wallet header so the server
// can verify ownership against company_onchain_binding.employer_wallet_address.

function norm(addr: string): string {
  return addr.toLowerCase();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CompanyBindingWithCompany = {
  company_onchain_binding_id: string;
  company_id: string;
  chain_id: number;
  employer_wallet_address: string;
  payroll_contract_address: string;
  active: boolean;
  created_at: string;
  company: {
    company_id: string;
    legal_name: string;
    country_code: string;
    created_at: string;
  } | null;
};

export type PayrollCadence = "monthly" | "semiMonthly" | "weekly";

export type EmployerRosterRow = {
  employment_chain_binding_id: string;
  employment_id: string;
  person_wallet_id: string;
  person_id: string;
  wallet_address: Address;
  active: boolean;
  job_title: string | null;
  employment_status: string;
  start_date: string;

  payroll_cadence: PayrollCadence;

  last_paid_pay_date?: string | null;     // YYYY-MM-DD
  last_paid_period_code?: string | null;  // e.g. monthly-2026-02
  next_pay_date?: string | null;          // YYYY-MM-DD (computed server-side)
  next_period_code?: string | null;       // for “current/next pay”
};

export type UpdateEmployeeOffchainParams = {
  employment_chain_binding_id: string;
  job_title?: string | null;
  employment_status?: string;
  start_date?: string;
  end_date?: string | null;
  active?: boolean;
  payroll_cadence?: PayrollCadence;
};

export type EmployeePayrollBinding = {
  payroll_contract_address: Address;
  company_id: string;
  company_name: string;
  company_onchain_binding_id: string;
  employment_chain_binding_id: string;
};

export type RegisterEmployeeParams = {
  company_onchain_binding_id: string;
  chain_id: number;
  wallet_address: Address;
  given_name: string;
  family_name: string;
  dni_type: string;
  dni_value: string;
  email?: string;
  job_title?: string;
  start_date: string; // "YYYY-MM-DD"
  payroll_cadence: PayrollCadence;
};

export type RegisterEmployeeResult = {
  person_id: string;
  person_wallet_id: string;
  employment_id: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Headers to include on all company-scoped API requests.
 * The server verifies the wallet matches the binding's employer_wallet_address.
 */
function employerHeaders(employerWallet: Address): HeadersInit {
  return {
    "content-type": "application/json",
    "x-employer-wallet": norm(employerWallet),
  };
}

// ── Company ───────────────────────────────────────────────────────────────────

export async function getEmployerCompanyBinding(params: {
  employerWalletAddress: Address;
  chainId: number;
}): Promise<CompanyBindingWithCompany | null> {
  const qs = new URLSearchParams({
    employer: params.employerWalletAddress,
    chainId: String(params.chainId),
  });

  const res = await fetch(`/api/company/binding?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load binding");
  return json.binding ?? null;
}

export async function upsertCompanyRegistration(params: {
  company_id: string;
  legal_name: string;
  country_code: string;
  chain_id: number;
  employer_wallet_address: Address;
  payroll_contract_address: Address;
}): Promise<void> {
  const res = await fetch("/api/company/register-sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `API /api/company/register-sync returned non-JSON (${res.status}). Body: ${text.slice(0, 120)}`
    );
  }

  if (!res.ok) {
    const j = json as Record<string, unknown>;
    throw new Error(
      (j?.error as Record<string, string>)?.message ??
        String(j?.error) ??
        `API error ${res.status}`
    );
  }
}

// ── Employee registration ─────────────────────────────────────────────────────

export async function registerEmployee(
  params: RegisterEmployeeParams,
  employerWallet: Address
): Promise<RegisterEmployeeResult> {
  const res = await fetch("/api/company/register-employee", {
    method: "POST",
    headers: employerHeaders(employerWallet),
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to register employee");
  return json as RegisterEmployeeResult;
}

// ── Employee roster ───────────────────────────────────────────────────────────

export async function getEmployerRoster(
  params: { company_onchain_binding_id: string },
  employerWallet: Address
): Promise<EmployerRosterRow[]> {
  const qs = new URLSearchParams({
    company_onchain_binding_id: params.company_onchain_binding_id,
  });

  const res = await fetch(`/api/company/roster?${qs.toString()}`, {
    headers: employerHeaders(employerWallet),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load roster");
  return (json.roster ?? []) as EmployerRosterRow[];
}

// ── Update employee fields (off-chain) ─────────────────────────────────────
export async function updateEmployeeOffchain(
  params: UpdateEmployeeOffchainParams,
  employerWallet: Address
): Promise<EmployerRosterRow> {
  const res = await fetch("/api/company/update-employee", {
    method: "PATCH",
    headers: employerHeaders(employerWallet),
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to update employee");
  return (json.updated ?? null) as EmployerRosterRow;
}

// ── Employee identity (PII) ───────────────────────────────────────────────────

export type EmployeeIdentity = {
  given_name: string;
  family_name: string;
  dni_type: string;
  dni_value: string;
  email: string;
};

export async function getEmployeeIdentity(
  params: { employment_chain_binding_id: string },
  employerWallet: Address
): Promise<EmployeeIdentity> {
  const qs = new URLSearchParams({
    employment_chain_binding_id: params.employment_chain_binding_id,
  });
  const res = await fetch(`/api/company/employee-identity?${qs}`, {
    headers: employerHeaders(employerWallet),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to fetch employee identity");
  return json as EmployeeIdentity;
}

export type UpdateEmployeePiiParams = {
  employment_chain_binding_id: string;
  given_name?: string;
  family_name?: string;
  dni_type?: string;
  dni_value?: string;
  email?: string | null;
};

// ── Remove employee (cascade delete) ─────────────────────────────────────────

export async function removeEmployeeFromCompany(
  params: { employment_chain_binding_id: string },
  employerWallet: Address         // ← required for ownership verification
): Promise<void> {
  const res = await fetch("/api/company/remove-employee", {
    method: "DELETE",
    headers: employerHeaders(employerWallet),
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to remove employee");
}

// ── Toggle active state (soft deactivate, no data deletion) ──────────────────

export async function syncEmployeeToCompany(params: {
  company_onchain_binding_id: string;
  employee_wallet_address: Address;
  chain_id: number;
  active: boolean;
}): Promise<void> {
  const res = await fetch("/api/company/employee-sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to sync employee");
}

// ── Company deletion (off-chain cascade) ─────────────────────────────────────

export async function deleteCompanyOffchain(
  params: { company_onchain_binding_id: string },
  employerWallet: Address
): Promise<void> {
  const res = await fetch("/api/company/delete", {
    method: "DELETE",
    headers: employerHeaders(employerWallet),
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to delete company");
}

// ── Employee-side: discover payroll bindings ──────────────────────────────────

export async function getEmployeePayrollBindings(params: {
  employeeWalletAddress: Address;
  chainId: number;
}): Promise<EmployeePayrollBinding[]> {
  const qs = new URLSearchParams({
    wallet: norm(params.employeeWalletAddress),
    chainId: String(params.chainId),
  });

  const res = await fetch(`/api/employee/bindings?${qs.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load employee bindings");
  return (json.bindings ?? []) as EmployeePayrollBinding[];
}

// ── Payroll logging for audits ──────────────────────────────────
export async function logPayrollRunOffchain(
  params: {
    company_onchain_binding_id: string;
    cadence: PayrollCadence;
    reference_date_utc: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm (UTC components)
    tx_hash: string;
    tx_status: "submitted" | "confirmed" | "failed" | string;
    currency_code: string;
    entries: Array<{
      employment_id: string;
      gross_amount_minor?: number; // optional; if omitted server stores 0
      net_amount_minor?: number;   // optional; if omitted server stores gross
      tax_withheld_minor?: number | null;
      social_security_minor?: number | null;
    }>;
  },
  employerWallet: Address
): Promise<void> {
  const res = await fetch("/api/company/log-payroll-run", {
    method: "POST",
    headers: employerHeaders(employerWallet),
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Failed to log payroll run");
}