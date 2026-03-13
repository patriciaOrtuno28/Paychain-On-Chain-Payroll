import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyCompanyOwnership } from "@/lib/apiAuth";

type PayrollCadence = "monthly" | "semiMonthly" | "weekly";

function parseDateInputAsUTC(dateInput: string): Date {
  // Accepts either:
  // - YYYY-MM-DD
  // - YYYY-MM-DDTHH:mm (datetime-local)
  // Interprets components as UTC.
  const [datePart, timePartRaw] = String(dateInput || "").split("T");
  const [y, m, d] = (datePart || "").split("-").map(Number);
  if (!y || !m || !d) return new Date();

  const timePart = (timePartRaw || "").split(/[Z.+-]/)[0];
  const [hh, mm] = timePart ? timePart.split(":").map(Number) : [0, 0];
  const hours = Number.isFinite(hh) ? hh : 0;
  const minutes = Number.isFinite(mm) ? mm : 0;

  return new Date(Date.UTC(y, m - 1, d, hours, minutes, 0, 0));
}

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

function computePayrollPeriodForDB(cadence: PayrollCadence, referenceUtc: string) {
  const ref = parseDateInputAsUTC(referenceUtc);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth() + 1;
  const day = ref.getUTCDate();

  if (cadence === "monthly") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0)); // last day of month
    const code = `monthly-${year}-${String(month).padStart(2, "0")}`;
    return {
      period_code: code,
      period_start: fmtDateUTC(start),
      period_end: fmtDateUTC(end),
      pay_date: fmtDateUTC(end),
    };
  }

  if (cadence === "semiMonthly") {
    const half = day <= 15 ? 1 : 2;
    const startDay = half === 1 ? 1 : 16;
    const endDay = half === 1 ? 15 : new Date(Date.UTC(year, month, 0)).getUTCDate();
    const start = new Date(Date.UTC(year, month - 1, startDay));
    const end = new Date(Date.UTC(year, month - 1, endDay));
    const code = `semiMonthly-${year}-${String(month).padStart(2, "0")}-${half}`;
    return {
      period_code: code,
      period_start: fmtDateUTC(start),
      period_end: fmtDateUTC(end),
      pay_date: fmtDateUTC(end),
    };
  }

  if (cadence === "weekly") {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utcMidnightMs = Date.UTC(year, month - 1, day);
    const bucket7d = Math.floor(utcMidnightMs / (7 * msPerDay));
    const bucketStart = new Date(bucket7d * 7 * msPerDay);
    const bucketEnd = new Date(bucketStart.getTime() + 6 * msPerDay);
    const code = `weekly-${fmtDateUTC(bucketStart)}`;
    return {
      period_code: code,
      period_start: fmtDateUTC(bucketStart),
      period_end: fmtDateUTC(bucketEnd),
      pay_date: fmtDateUTC(bucketEnd),
    };
  }

  // fallback to weekly
  const msPerDay2 = 24 * 60 * 60 * 1000;
  const utcMidnightMs = Date.UTC(year, month - 1, day);
  const bucket7d = Math.floor(utcMidnightMs / (7 * msPerDay2));
  const bucketStart = new Date(bucket7d * 7 * msPerDay2);
  const bucketEnd = new Date(bucketStart.getTime() + 6 * msPerDay2);
  const code = `weekly-${fmtDateUTC(bucketStart)}`;
  return {
    period_code: code,
    period_start: fmtDateUTC(bucketStart),
    period_end: fmtDateUTC(bucketEnd),
    pay_date: fmtDateUTC(bucketEnd),
  };
}

export async function POST(req: Request) {
  const caller_wallet = req.headers.get("x-employer-wallet") ?? "";
  const body = await req.json().catch(() => null);

  if (!body?.company_onchain_binding_id) {
    return NextResponse.json({ error: { message: "Missing company_onchain_binding_id" } }, { status: 400 });
  }
  if (!body?.cadence || !body?.reference_date_utc) {
    return NextResponse.json({ error: { message: "Missing cadence or reference_date_utc" } }, { status: 400 });
  }
  if (!Array.isArray(body?.entries) || body.entries.length === 0) {
    return NextResponse.json({ error: { message: "Missing entries[]" } }, { status: 400 });
  }

  const company_onchain_binding_id = String(body.company_onchain_binding_id);
  const cadence = String(body.cadence) as PayrollCadence;
  const reference_date_utc = String(body.reference_date_utc);
  const tx_hash = String(body.tx_hash ?? "");
  const tx_status = String(body.tx_status ?? "confirmed");
  const currency_code = String(body.currency_code ?? "USDC");

  const ownershipError = await verifyCompanyOwnership({ company_onchain_binding_id, caller_wallet });
  if (ownershipError) return NextResponse.json({ error: ownershipError }, { status: 403 });

  // Resolve company_id for payroll_period FK
  const { data: binding, error: bindingErr } = await supabaseAdmin
    .from("company_onchain_binding")
    .select("company_id")
    .eq("company_onchain_binding_id", company_onchain_binding_id)
    .single();

  if (bindingErr || !binding) {
    return NextResponse.json({ error: { message: "Company binding not found" } }, { status: 404 });
  }

  const company_id = binding.company_id;

  const period = computePayrollPeriodForDB(cadence, reference_date_utc);

  // Upsert payroll_period (no dependency on DB unique index; we query first)
  const { data: existingPeriod, error: findErr } = await supabaseAdmin
    .from("payroll_period")
    .select("payroll_period_id,status")
    .eq("company_id", company_id)
    .eq("period_code", period.period_code)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr }, { status: 500 });

  let payroll_period_id: string;

  if (!existingPeriod) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from("payroll_period")
      .insert({
        company_id,
        period_code: period.period_code,
        period_start: period.period_start,
        period_end: period.period_end,
        pay_date: period.pay_date,
        status: tx_status === "confirmed" ? "paid" : "pending",
      })
      .select("payroll_period_id")
      .single();

    if (createErr || !created) return NextResponse.json({ error: createErr }, { status: 500 });
    payroll_period_id = created.payroll_period_id;
  } else {
    payroll_period_id = existingPeriod.payroll_period_id;
    // keep dates stable; just bump status forward
    const nextStatus = tx_status === "confirmed" ? "paid" : existingPeriod.status;
    await supabaseAdmin.from("payroll_period").update({ status: nextStatus }).eq("payroll_period_id", payroll_period_id);
  }

  const employmentIds = body.entries.map((e: any) => String(e.employment_id));
  const { data: existingEntries } = await supabaseAdmin
    .from("payroll_entry")
    .select("payroll_entry_id,employment_id")
    .eq("payroll_period_id", payroll_period_id)
    .in("employment_id", employmentIds);

  const existingMap = new Map((existingEntries ?? []).map((r) => [r.employment_id, r.payroll_entry_id]));

  const toInsert = [];
  const toUpdate = [];

  for (const e of body.entries) {
    const employment_id = String(e.employment_id);
    const gross = Number.isFinite(e.gross_amount_minor) ? Number(e.gross_amount_minor) : 0;
    const net = Number.isFinite(e.net_amount_minor) ? Number(e.net_amount_minor) : gross;

    const row = {
      payroll_period_id,
      employment_id,
      currency_code,
      gross_amount_minor: gross,
      net_amount_minor: net,
      tax_withheld_minor: e.tax_withheld_minor ?? null,
      social_security_minor: e.social_security_minor ?? null,
      onchain_payment_tx_hash: tx_hash || null,
      onchain_payment_status: tx_status,
    };

    const existingId = existingMap.get(employment_id);
    if (existingId) {
      toUpdate.push({ payroll_entry_id: existingId, ...row });
    } else {
      toInsert.push(row);
    }
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await supabaseAdmin.from("payroll_entry").insert(toInsert);
    if (insErr) return NextResponse.json({ error: insErr }, { status: 500 });
  }

  for (const u of toUpdate) {
    const { payroll_entry_id, ...payload } = u as any;
    const { error: updErr } = await supabaseAdmin.from("payroll_entry").update(payload).eq("payroll_entry_id", payroll_entry_id);
    if (updErr) return NextResponse.json({ error: updErr }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    payroll_period_id,
    period_code: period.period_code,
    period_start: period.period_start,
    period_end: period.period_end,
    pay_date: period.pay_date,
    inserted: toInsert.length,
    updated: toUpdate.length,
  });
}