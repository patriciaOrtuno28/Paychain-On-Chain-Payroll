import type { PayrollCadence } from "@/lib/supabasePayroll";

export function todayUtcDateInput(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInputAsUTC(dateInput: string): Date {
  const [datePart, timePartRaw] = String(dateInput || "").split("T");
  const [y, m, d] = (datePart || "").split("-").map(Number);
  if (!y || !m || !d) return new Date();
  const timePart = (timePartRaw || "").split(/[Z.+-]/)[0];
  const [hh, mm] = timePart ? timePart.split(":").map(Number) : [0, 0];
  const hours = Number.isFinite(hh) ? hh : 0;
  const minutes = Number.isFinite(mm) ? mm : 0;
  return new Date(Date.UTC(y, m - 1, d, hours, minutes, 0, 0));
}

export function buildPayrollPeriod(
  cadence: PayrollCadence,
  dateInput: string
): { id: bigint; humanLabel: string } {
  const d = parseDateInputAsUTC(dateInput);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  if (cadence === "monthly") {
    const id = BigInt(year * 100 + month);
    const humanLabel = `${year}-${String(month).padStart(2, "0")} (monthly)`;
    return { id, humanLabel };
  }

  if (cadence === "semiMonthly") {
    const half = day <= 15 ? 1 : 2;
    const id = 15_000_000_000n + BigInt(year * 1000 + month * 10 + half);
    const humanLabel = `${year}-${String(month).padStart(2, "0")} · fortnight ${half}`;
    return { id, humanLabel };
  }

  // weekly
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcMidnightMs = Date.UTC(year, month - 1, day);
  const bucket7d = Math.floor(utcMidnightMs / (7 * msPerDay));
  const id = 7_000_000_000n + BigInt(bucket7d);
  const humanLabel = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} · week bucket`;
  return { id, humanLabel };
}

/** Computes the date when the NEXT period starts after the given date. */
export function computeNextPeriodStart(cadence: PayrollCadence, fromDateInput: string): string {
  const d = parseDateInputAsUTC(fromDateInput);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  if (cadence === "monthly") {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  }

  if (cadence === "semiMonthly") {
    if (day <= 15) return `${year}-${String(month).padStart(2, "0")}-16`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  }

  // weekly — next 7-day bucket start
  const msPerDay = 24 * 60 * 60 * 1000;
  const todayMs = Date.UTC(year, month - 1, day);
  const msPerWeek = 7 * msPerDay;
  const currentBucket = Math.floor(todayMs / msPerWeek);
  const next = new Date((currentBucket + 1) * msPerWeek);
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}
