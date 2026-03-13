import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/employee/bindings?wallet=0x...&chainId=11155111
//
// Returns all active payroll contracts the given wallet is employed under.
// Used by the employee portal to discover which companies they belong to.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") ?? "").toLowerCase();
  const chainId = Number(url.searchParams.get("chainId") ?? "0");

  if (!wallet || !chainId) {
    return NextResponse.json(
      { error: { message: "Missing wallet or chainId" } },
      { status: 400 }
    );
  }

  // 1. Find active person_wallet records for this address + chain
  const { data: wallets, error: walletsErr } = await supabaseAdmin
    .from("person_wallet")
    .select("person_wallet_id")
    .eq("wallet_address", wallet)
    .eq("chain_id", chainId)
    .eq("active", true);

  if (walletsErr) return NextResponse.json({ error: walletsErr }, { status: 500 });
  if (!wallets || wallets.length === 0) return NextResponse.json({ bindings: [] });

  const personWalletIds = wallets.map((w) => w.person_wallet_id);

  // 2. Find active employment_chain_bindings for those wallets
  const { data: ecbs, error: ecbsErr } = await supabaseAdmin
    .from("employment_chain_binding")
    .select("*")
    .in("person_wallet_id", personWalletIds)
    .eq("active", true);

  if (ecbsErr) return NextResponse.json({ error: ecbsErr }, { status: 500 });
  if (!ecbs || ecbs.length === 0) return NextResponse.json({ bindings: [] });

  const companyOnchainBindingIds = [...new Set(ecbs.map((r) => r.company_onchain_binding_id))];

  // 3. Get active company_onchain_bindings
  const { data: companyBindings, error: companyBindingsErr } = await supabaseAdmin
    .from("company_onchain_binding")
    .select("*")
    .in("company_onchain_binding_id", companyOnchainBindingIds)
    .eq("chain_id", chainId)
    .eq("active", true);

  if (companyBindingsErr) return NextResponse.json({ error: companyBindingsErr }, { status: 500 });
  if (!companyBindings || companyBindings.length === 0) return NextResponse.json({ bindings: [] });

  const companyIds = [...new Set(companyBindings.map((b) => b.company_id))];

  // 4. Get company names
  const { data: companies, error: companiesErr } = await supabaseAdmin
    .from("company")
    .select("*")
    .in("company_id", companyIds);

  if (companiesErr) return NextResponse.json({ error: companiesErr }, { status: 500 });

  const companyById = new Map((companies ?? []).map((c) => [c.company_id, c]));
  const companyBindingById = new Map(
    companyBindings.map((b) => [b.company_onchain_binding_id, b])
  );

  // 5. Join everything
  const bindings = [];
  const seen = new Set<string>(); // deduplicate by payroll contract address

  for (const ecb of ecbs) {
    const cb = companyBindingById.get(ecb.company_onchain_binding_id);
    if (!cb) continue;

    const payrollAddr = cb.payroll_contract_address.toLowerCase();
    if (seen.has(payrollAddr)) continue;
    seen.add(payrollAddr);

    const company = companyById.get(cb.company_id);

    bindings.push({
      payroll_contract_address: payrollAddr,
      company_id: cb.company_id,
      company_name: company?.legal_name ?? "(Unknown company)",
      company_onchain_binding_id: cb.company_onchain_binding_id,
      employment_chain_binding_id: ecb.employment_chain_binding_id,
    });
  }

  return NextResponse.json({ bindings });
}