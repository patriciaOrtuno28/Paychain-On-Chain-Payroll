import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

type PayrollCadence = "monthly" | "semiMonthly" | "weekly";

function fmtDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return fmtDateUTC(d);
}

function computePeriod(cadence: PayrollCadence, referenceISO: string) {
  const ref = new Date(`${referenceISO}T00:00:00Z`);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth() + 1;
  const day = ref.getUTCDate();

  if (cadence === "monthly") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const code = `monthly-${year}-${String(month).padStart(2, "0")}`;
    return { period_code: code, period_start: fmtDateUTC(start), period_end: fmtDateUTC(end), pay_date: fmtDateUTC(end) };
  }

  if (cadence === "semiMonthly") {
    const half = day <= 15 ? 1 : 2;
    const startDay = half === 1 ? 1 : 16;
    const endDay = half === 1 ? 15 : new Date(Date.UTC(year, month, 0)).getUTCDate();
    const start = new Date(Date.UTC(year, month - 1, startDay));
    const end = new Date(Date.UTC(year, month - 1, endDay));
    const code = `semiMonthly-${year}-${String(month).padStart(2, "0")}-${half}`;
    return { period_code: code, period_start: fmtDateUTC(start), period_end: fmtDateUTC(end), pay_date: fmtDateUTC(end) };
  }

  if (cadence === "weekly") {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utcMidnightMs = Date.UTC(year, month - 1, day);
    const bucket7d = Math.floor(utcMidnightMs / (7 * msPerDay));
    const bucketStart = new Date(bucket7d * 7 * msPerDay);
    const bucketEnd = new Date(bucketStart.getTime() + 6 * msPerDay);
    const code = `weekly-${fmtDateUTC(bucketStart)}`;
    return { period_code: code, period_start: fmtDateUTC(bucketStart), period_end: fmtDateUTC(bucketEnd), pay_date: fmtDateUTC(bucketEnd) };
  }

  // fallback to weekly
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcMidnightMs = Date.UTC(year, month - 1, day);
  const bucket7d = Math.floor(utcMidnightMs / (7 * msPerDay));
  const bucketStart = new Date(bucket7d * 7 * msPerDay);
  const bucketEnd = new Date(bucketStart.getTime() + 6 * msPerDay);
  const code = `weekly-${fmtDateUTC(bucketStart)}`;
  return { period_code: code, period_start: fmtDateUTC(bucketStart), period_end: fmtDateUTC(bucketEnd), pay_date: fmtDateUTC(bucketEnd) };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const company_onchain_binding_id = url.searchParams.get("company_onchain_binding_id");
  const caller_wallet = req.headers.get("x-employer-wallet") ?? "";

  if (!company_onchain_binding_id) {
    return NextResponse.json({ error: { message: "Missing company_onchain_binding_id" } }, { status: 400 });
  }

  const ownershipError = await verifyCompanyOwnership({ company_onchain_binding_id, caller_wallet });
  if (ownershipError) return NextResponse.json({ error: ownershipError }, { status: 403 });

  const { data: chainBindings, error: chainBindingsErr } = await supabaseAdmin
    .from("employment_chain_binding")
    .select("*")
    .eq("company_onchain_binding_id", company_onchain_binding_id);

  if (chainBindingsErr) return NextResponse.json({ error: chainBindingsErr }, { status: 500 });
  if (!chainBindings || chainBindings.length === 0) return NextResponse.json({ roster: [] });

  const personWalletIds = [...new Set(chainBindings.map((r) => r.person_wallet_id))];
  const employmentIds = [...new Set(chainBindings.map((r) => r.employment_id))];

  const [{ data: wallets, error: walletsErr }, { data: employments, error: employmentsErr }] = await Promise.all([
    supabaseAdmin.from("person_wallet").select("*").in("person_wallet_id", personWalletIds),
    supabaseAdmin.from("employment").select("*").in("employment_id", employmentIds),
  ]);

  if (walletsErr) return NextResponse.json({ error: walletsErr }, { status: 500 });
  if (employmentsErr) return NextResponse.json({ error: employmentsErr }, { status: 500 });

  // Fetch latest payroll_entry per employment_id (with payroll_period)
  const { data: entries, error: entriesErr } = await supabaseAdmin
    .from("payroll_entry")
    .select("employment_id,onchain_payment_status,onchain_payment_tx_hash,created_at,payroll_period:payroll_period_id(period_code,period_end,pay_date)")
    .in("employment_id", employmentIds)
    .order("created_at", { ascending: false });

  if (entriesErr) return NextResponse.json({ error: entriesErr }, { status: 500 });

  const latestByEmployment = new Map<string, any>();
  const badStatuses = new Set(["failed", "reverted"]);
  for (const e of entries ?? []) {
    if (latestByEmployment.has(e.employment_id)) continue;
    const s = String(e.onchain_payment_status ?? "").toLowerCase();
    if (badStatuses.has(s)) continue;
    latestByEmployment.set(e.employment_id, e);
  }

  const walletById = new Map((wallets ?? []).map((w: any) => [w.person_wallet_id, w]));
  const employmentById = new Map((employments ?? []).map((e: any) => [e.employment_id, e]));

  const roster = chainBindings
    .map((b: any) => {
      const w = walletById.get(b.person_wallet_id);
      const e = employmentById.get(b.employment_id);
      if (!w || !e) return null;

      const cadence: PayrollCadence = (e.payroll_cadence ?? "monthly") as PayrollCadence;
      const latest = latestByEmployment.get(b.employment_id);
      const lastPayDate = latest?.payroll_period?.pay_date ?? null;
      const lastPeriodCode = latest?.payroll_period?.period_code ?? null;
      const lastPeriodEnd = latest?.payroll_period?.period_end ?? null;

      // next due: if we have a lastPeriodEnd, compute next period using (end + 1 day), else compute from start_date
      const ref = lastPeriodEnd ? addDaysISO(lastPeriodEnd, 1) : String(e.start_date);
      const next = computePeriod(cadence, ref);

      return {
        employment_chain_binding_id: b.employment_chain_binding_id,
        employment_id: b.employment_id,
        person_wallet_id: b.person_wallet_id,
        person_id: e.person_id,
        wallet_address: w.wallet_address.toLowerCase(),
        active: b.active,
        job_title: e.job_title,
        employment_status: e.employment_status,
        start_date: e.start_date,

        payroll_cadence: cadence,
        last_paid_pay_date: lastPayDate,
        last_paid_period_code: lastPeriodCode,
        next_pay_date: next.pay_date,
        next_period_code: next.period_code,
      };
    })
    .filter(Boolean);

  roster.sort((a: any, b: any) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.wallet_address.localeCompare(b.wallet_address);
  });

  return NextResponse.json({ roster });
}