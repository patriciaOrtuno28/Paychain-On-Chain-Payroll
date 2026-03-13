import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

type Body = {
  employment_chain_binding_id: string;
  // employment table fields
  job_title?: string | null;
  employment_status?: string;
  start_date?: string;
  end_date?: string | null;
  payroll_cadence?: string;
  // employment_chain_binding fields
  active?: boolean;
};

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const caller_wallet = req.headers.get("x-employer-wallet") ?? "";

    const {
      employment_chain_binding_id,
      job_title,
      employment_status,
      start_date,
      end_date,
      payroll_cadence,
      active,
    } = body ?? {};

    if (!employment_chain_binding_id) {
      return NextResponse.json(
        { error: { message: "Missing employment_chain_binding_id" } },
        { status: 400 }
      );
    }

    const hasAnyUpdate =
      job_title !== undefined ||
      employment_status !== undefined ||
      start_date !== undefined ||
      end_date !== undefined ||
      payroll_cadence !== undefined ||
      active !== undefined;

    if (!hasAnyUpdate) {
      return NextResponse.json(
        { error: { message: "No updatable fields provided" } },
        { status: 400 }
      );
    }

    // ── Resolve chain binding to check ownership + get ids ──────────────────
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

    // ── Ownership check ─────────────────────────────────────────────────────
    const ownershipError = await verifyCompanyOwnership({
      company_onchain_binding_id: binding.company_onchain_binding_id,
      caller_wallet,
    });
    if (ownershipError) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // ── Apply updates ───────────────────────────────────────────────────────
    const employmentUpdates: Record<string, unknown> = {};
    if (job_title !== undefined) {
      const jt = job_title === "" ? null : job_title;
      employmentUpdates.job_title = jt;
    }
    if (employment_status !== undefined) employmentUpdates.employment_status = employment_status;
    if (start_date !== undefined) employmentUpdates.start_date = start_date;
    if (end_date !== undefined) employmentUpdates.end_date = end_date;
    if (payroll_cadence !== undefined) employmentUpdates.payroll_cadence = payroll_cadence;

    const chainBindingUpdates: Record<string, unknown> = {};
    if (active !== undefined) chainBindingUpdates.active = !!active;

    // Update employment row (if needed)
    if (Object.keys(employmentUpdates).length > 0) {
      const { error: empErr } = await supabaseAdmin
        .from("employment")
        .update(employmentUpdates)
        .eq("employment_id", binding.employment_id);

      if (empErr) return NextResponse.json({ error: empErr }, { status: 500 });
    }

    // Update chain binding row (if needed)
    if (Object.keys(chainBindingUpdates).length > 0) {
      const { error: ecbErr } = await supabaseAdmin
        .from("employment_chain_binding")
        .update(chainBindingUpdates)
        .eq("employment_chain_binding_id", employment_chain_binding_id);

      if (ecbErr) return NextResponse.json({ error: ecbErr }, { status: 500 });
    }

    // ── Return updated roster row shape (same as /api/company/roster) ───────
    const [
      { data: updatedBinding, error: updatedBindingErr },
      { data: employment, error: empGetErr },
    ] = await Promise.all([
      supabaseAdmin
        .from("employment_chain_binding")
        .select("*")
        .eq("employment_chain_binding_id", employment_chain_binding_id)
        .single(),
      supabaseAdmin
        .from("employment")
        .select("*")
        .eq("employment_id", binding.employment_id)
        .single(),
    ]);

    if (updatedBindingErr || !updatedBinding) {
      return NextResponse.json(
        { error: { message: "Failed to load updated employment_chain_binding" } },
        { status: 500 }
      );
    }
    if (empGetErr || !employment) {
      return NextResponse.json(
        { error: { message: "Failed to load updated employment" } },
        { status: 500 }
      );
    }

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from("person_wallet")
      .select("*")
      .eq("person_wallet_id", updatedBinding.person_wallet_id)
      .single();

    if (walletErr || !wallet) {
      return NextResponse.json(
        { error: { message: "Failed to load person_wallet" } },
        { status: 500 }
      );
    }

    const rosterRow = {
      employment_chain_binding_id: updatedBinding.employment_chain_binding_id,
      employment_id: updatedBinding.employment_id,
      person_wallet_id: updatedBinding.person_wallet_id,
      person_id: employment.person_id,
      wallet_address: String(wallet.wallet_address).toLowerCase(),
      active: !!updatedBinding.active,
      job_title: employment.job_title,
      employment_status: employment.employment_status,
      start_date: employment.start_date,
      payroll_cadence: employment.payroll_cadence ?? "monthly",
    };

    return NextResponse.json({ ok: true, updated: rosterRow });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}