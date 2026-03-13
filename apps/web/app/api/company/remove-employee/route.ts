import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { employment_chain_binding_id } = body ?? {};
    const caller_wallet = req.headers.get("x-employer-wallet") ?? "";

    if (!employment_chain_binding_id) {
      return NextResponse.json(
        { error: { message: "Missing employment_chain_binding_id" } },
        { status: 400 }
      );
    }

    // ── Resolve binding to get company_onchain_binding_id for ownership check ─
    const { data: binding, error: bindingErr } = await supabaseAdmin
      .from("employment_chain_binding")
      .select("*")
      .eq("employment_chain_binding_id", employment_chain_binding_id)
      .single();

    if (bindingErr || !binding) {
      return NextResponse.json(
        { error: { message: "employment_chain_binding not found" } },
        { status: 404 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    const ownershipError = await verifyCompanyOwnership({
      company_onchain_binding_id: binding.company_onchain_binding_id,
      caller_wallet,
    });
    if (ownershipError) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { employment_id, person_wallet_id } = binding;

    // ── Resolve person_id from employment ─────────────────────────────────────
    const { data: employment, error: employmentLookupErr } = await supabaseAdmin
      .from("employment")
      .select("person_id")
      .eq("employment_id", employment_id)
      .single();

    if (employmentLookupErr || !employment) {
      return NextResponse.json(
        { error: { message: "employment not found" } },
        { status: 404 }
      );
    }

    const { person_id } = employment;

    // ── Cascade delete in FK-safe order ───────────────────────────────────────
    const { error: ecbErr } = await supabaseAdmin
      .from("employment_chain_binding")
      .delete()
      .eq("employment_chain_binding_id", employment_chain_binding_id);
    if (ecbErr) return NextResponse.json({ error: ecbErr }, { status: 500 });

    const { error: empErr } = await supabaseAdmin
      .from("employment")
      .delete()
      .eq("employment_id", employment_id);
    if (empErr) return NextResponse.json({ error: empErr }, { status: 500 });

    const { error: walletErr } = await supabaseAdmin
      .from("person_wallet")
      .delete()
      .eq("person_wallet_id", person_wallet_id);
    if (walletErr) return NextResponse.json({ error: walletErr }, { status: 500 });

    const { error: identityErr } = await supabaseAdmin
      .from("person_identity")
      .delete()
      .eq("person_id", person_id);
    if (identityErr) return NextResponse.json({ error: identityErr }, { status: 500 });

    // Only delete person if no other employments/wallets remain
    const { count: remainingEmployments } = await supabaseAdmin
      .from("employment")
      .select("*", { count: "exact", head: true })
      .eq("person_id", person_id);

    const { count: remainingWallets } = await supabaseAdmin
      .from("person_wallet")
      .select("*", { count: "exact", head: true })
      .eq("person_id", person_id);

    if ((remainingEmployments ?? 0) === 0 && (remainingWallets ?? 0) === 0) {
      const { error: personErr } = await supabaseAdmin
        .from("person")
        .delete()
        .eq("person_id", person_id);
      if (personErr) return NextResponse.json({ error: personErr }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deleted: { employment_chain_binding_id, employment_id, person_wallet_id, person_id },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}