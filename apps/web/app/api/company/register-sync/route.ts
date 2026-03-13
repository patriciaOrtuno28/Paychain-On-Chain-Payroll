import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      company_id,
      legal_name,
      country_code,
      chain_id,
      employer_wallet_address,
      payroll_contract_address,
    } = body ?? {};

    if (!company_id || !legal_name || !country_code || !chain_id || !employer_wallet_address || !payroll_contract_address) {
      return NextResponse.json({ error: { message: "Missing fields" } }, { status: 400 });
    }

    const { error: companyErr } = await supabaseAdmin
      .from("company")
      .upsert(
        { company_id, legal_name, country_code: String(country_code).toUpperCase() },
        { onConflict: "company_id" }
      );

    if (companyErr) return NextResponse.json({ error: companyErr }, { status: 500 });

    const { error: bindErr } = await supabaseAdmin
      .from("company_onchain_binding")
      .upsert(
        {
          company_id,
          chain_id: Number(chain_id),
          employer_wallet_address: String(employer_wallet_address).toLowerCase(),
          payroll_contract_address: String(payroll_contract_address).toLowerCase(),
          active: true,
        },
        { onConflict: "chain_id,employer_wallet_address" } // matches unique_chain_employer_wallet
      );

    if (bindErr) return NextResponse.json({ error: bindErr }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}