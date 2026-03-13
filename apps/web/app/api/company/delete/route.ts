import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

/**
 * DELETE /api/company/delete
 *
 * Body: { company_onchain_binding_id: string }
 * Header: x-employer-wallet (lowercase address)
 *
 * Cascade-deletes from Supabase:
 *   employment_chain_binding → employment → person_wallet → person_identity → person (if orphaned)
 *   → company_onchain_binding → company (if no other bindings)
 *
 * The on-chain deactivation (Payroll.deactivate + Registry.deleteCompany) must be done
 * client-side before calling this endpoint.
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { company_onchain_binding_id } = body ?? {};
    const caller_wallet = req.headers.get("x-employer-wallet") ?? "";

    if (!company_onchain_binding_id) {
      return NextResponse.json(
        { error: { message: "Missing company_onchain_binding_id" } },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    const ownershipError = await verifyCompanyOwnership({
      company_onchain_binding_id,
      caller_wallet,
    });
    if (ownershipError) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // ── Fetch the binding to get company_id ───────────────────────────────────
    const { data: binding, error: bindingErr } = await supabaseAdmin
      .from("company_onchain_binding")
      .select("company_id")
      .eq("company_onchain_binding_id", company_onchain_binding_id)
      .single();

    if (bindingErr || !binding) {
      return NextResponse.json(
        { error: { message: "Company binding not found" } },
        { status: 404 }
      );
    }

    const { company_id } = binding;

    // ── Fetch all employment_chain_bindings for this company binding ──────────
    const { data: ecbRows, error: ecbFetchErr } = await supabaseAdmin
      .from("employment_chain_binding")
      .select("employment_chain_binding_id, employment_id, person_wallet_id")
      .eq("company_onchain_binding_id", company_onchain_binding_id);

    if (ecbFetchErr) {
      return NextResponse.json({ error: ecbFetchErr }, { status: 500 });
    }

    // ── Cascade-delete each employee record ───────────────────────────────────
    for (const ecb of ecbRows ?? []) {
      const { employment_chain_binding_id, employment_id, person_wallet_id } = ecb;

      // Resolve person_id
      const { data: emp } = await supabaseAdmin
        .from("employment")
        .select("person_id")
        .eq("employment_id", employment_id)
        .single();

      const person_id = emp?.person_id;

      // Delete employment_chain_binding
      await supabaseAdmin
        .from("employment_chain_binding")
        .delete()
        .eq("employment_chain_binding_id", employment_chain_binding_id);

      // Delete employment
      await supabaseAdmin
        .from("employment")
        .delete()
        .eq("employment_id", employment_id);

      // Delete person_wallet
      await supabaseAdmin
        .from("person_wallet")
        .delete()
        .eq("person_wallet_id", person_wallet_id);

      if (person_id) {
        // Delete person_identity
        await supabaseAdmin
          .from("person_identity")
          .delete()
          .eq("person_id", person_id);

        // Delete person only if fully orphaned
        const { count: remainingEmployments } = await supabaseAdmin
          .from("employment")
          .select("*", { count: "exact", head: true })
          .eq("person_id", person_id);

        const { count: remainingWallets } = await supabaseAdmin
          .from("person_wallet")
          .select("*", { count: "exact", head: true })
          .eq("person_id", person_id);

        if ((remainingEmployments ?? 0) === 0 && (remainingWallets ?? 0) === 0) {
          await supabaseAdmin.from("person").delete().eq("person_id", person_id);
        }
      }
    }

    // ── Delete company_onchain_binding ────────────────────────────────────────
    const { error: cobErr } = await supabaseAdmin
      .from("company_onchain_binding")
      .delete()
      .eq("company_onchain_binding_id", company_onchain_binding_id);

    if (cobErr) return NextResponse.json({ error: cobErr }, { status: 500 });

    // ── Delete company if no other bindings reference it ──────────────────────
    const { count: remainingBindings } = await supabaseAdmin
      .from("company_onchain_binding")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company_id);

    if ((remainingBindings ?? 0) === 0) {
      await supabaseAdmin.from("company").delete().eq("company_id", company_id);
    }

    return NextResponse.json({
      ok: true,
      deleted: { company_onchain_binding_id, company_id },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
