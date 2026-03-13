// apps/web/app/api/company/employee-sync/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_onchain_binding_id, employee_wallet_address, chain_id, active } = body ?? {};

    if (!company_onchain_binding_id || !employee_wallet_address || !chain_id || typeof active !== "boolean") {
      return NextResponse.json({ error: { message: "Missing fields" } }, { status: 400 });
    }

    const wallet = String(employee_wallet_address).toLowerCase();

    // Find the person_wallet for this address + chain
    const { data: wallets, error: walletErr } = await supabaseAdmin
      .from("person_wallet")
      .select("person_wallet_id")
      .eq("wallet_address", wallet)
      .eq("chain_id", Number(chain_id));

    if (walletErr) return NextResponse.json({ error: walletErr }, { status: 500 });
    if (!wallets || wallets.length === 0) {
      return NextResponse.json(
        { error: { message: "No person_wallet found for this address. Register the employee first." } },
        { status: 404 }
      );
    }

    const personWalletIds = wallets.map((w) => w.person_wallet_id);

    // Update the binding's active status
    const { error: updateErr } = await supabaseAdmin
      .from("employment_chain_binding")
      .update({
        active,
        unlinked_at: active ? null : new Date().toISOString(),
      })
      .eq("company_onchain_binding_id", company_onchain_binding_id)
      .in("person_wallet_id", personWalletIds);

    if (updateErr) return NextResponse.json({ error: updateErr }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}