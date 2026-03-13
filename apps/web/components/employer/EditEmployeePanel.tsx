"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/useDictionary";
import type { EmployeeIdentity, EmployerRosterRow, PayrollCadence, UpdateEmployeeOffchainParams, UpdateEmployeePiiParams } from "@/lib/supabasePayroll";

const CADENCE_KEYS: PayrollCadence[] = ["monthly", "semiMonthly", "weekly"];
const CADENCE_LABELS: Record<PayrollCadence, string> = {
  monthly: "Monthly",
  semiMonthly: "Semi-monthly (15 days)",
  weekly: "Weekly",
};

type Props = {
  row: EmployerRosterRow;
  identity: EmployeeIdentity | null;
  identityLoading: boolean;
  onSaveOffchain: (
    updates: Omit<UpdateEmployeeOffchainParams, "employment_chain_binding_id">
  ) => Promise<void>;
  onSavePii: (
    updates: Omit<UpdateEmployeePiiParams, "employment_chain_binding_id">
  ) => Promise<void>;

  underlyingSymbol: string;
  updateSalaryInput: string;
  setUpdateSalaryInput: (value: string) => void;
  onUpdateSalary: () => Promise<void>;

  computedPayrollPeriod: { humanLabel: string; id: bigint };
  computedRunId: string | null;
  onRunPayrollSingle: () => Promise<void>;

  t: Dictionary["editEmployeePanel"];
};

export function EditEmployeePanel(props: Props) {
  const {
    row,
    identity,
    identityLoading,
    onSaveOffchain,
    onSavePii,
    underlyingSymbol,
    updateSalaryInput,
    setUpdateSalaryInput,
    onUpdateSalary,
    computedPayrollPeriod,
    computedRunId,
    onRunPayrollSingle,
    t,
  } = props;

  const [jobTitle, setJobTitle] = useState(row.job_title ?? "");
  const [startDate, setStartDate] = useState(row.start_date);
  const [employmentStatus, setEmploymentStatus] = useState(row.employment_status ?? "active");
  const [active, setActive] = useState(!!row.active);
  const [payrollCadence, setPayrollCadence] = useState<PayrollCadence>(row.payroll_cadence ?? "monthly");
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>("");

  // PII fields
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [dniType, setDniType] = useState("");
  const [dniValue, setDniValue] = useState("");
  const [email, setEmail] = useState("");
  const [savingPii, setSavingPii] = useState(false);
  const [piiStatus, setPiiStatus] = useState<string>("");

  useEffect(() => {
    setJobTitle(row.job_title ?? "");
    setStartDate(row.start_date);
    setEmploymentStatus(row.employment_status ?? "active");
    setActive(!!row.active);
    setPayrollCadence(row.payroll_cadence ?? "monthly");
    setLocalStatus("");
    setPiiStatus("");
  }, [row.employment_chain_binding_id]);

  useEffect(() => {
    if (identity) {
      setGivenName(identity.given_name);
      setFamilyName(identity.family_name);
      setDniType(identity.dni_type);
      setDniValue(identity.dni_value);
      setEmail(identity.email ?? "");
    }
  }, [identity]);

  const dirty = useMemo(() => {
    const jt = jobTitle.trim();
    const originalJt = (row.job_title ?? "").trim();
    if (jt !== originalJt) return true;
    if (startDate !== row.start_date) return true;
    if ((employmentStatus || "").trim() !== (row.employment_status || "").trim()) return true;
    if (active !== !!row.active) return true;
    if (payrollCadence !== (row.payroll_cadence ?? "monthly")) return true;
    return false;
  }, [active, employmentStatus, jobTitle, payrollCadence, row.active, row.employment_status, row.job_title, row.payroll_cadence, row.start_date, startDate]);

  async function handleSavePii() {
    setSavingPii(true);
    setPiiStatus("");
    try {
      const updates: Omit<UpdateEmployeePiiParams, "employment_chain_binding_id"> = {};
      if (identity) {
        if (givenName.trim() !== identity.given_name) updates.given_name = givenName.trim();
        if (familyName.trim() !== identity.family_name) updates.family_name = familyName.trim();
        if (dniType !== identity.dni_type) updates.dni_type = dniType;
        if (dniValue.trim() !== identity.dni_value) updates.dni_value = dniValue.trim();
        if ((email ?? "") !== (identity.email ?? "")) updates.email = email || null;
      }
      if (Object.keys(updates).length === 0) return;
      await onSavePii(updates);
      setPiiStatus(`✅ ${t.saved}`);
    } catch (e) {
      setPiiStatus(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingPii(false);
    }
  }

  const piiDirty = identity
    ? givenName.trim() !== identity.given_name ||
      familyName.trim() !== identity.family_name ||
      dniType !== identity.dni_type ||
      dniValue.trim() !== identity.dni_value ||
      (email ?? "") !== (identity.email ?? "")
    : false;

  async function handleSave() {
    setSaving(true);
    setLocalStatus("");
    try {
      const updates: Omit<UpdateEmployeeOffchainParams, "employment_chain_binding_id"> = {};

      const jt = jobTitle.trim();
      const originalJt = (row.job_title ?? "").trim();
      if (jt !== originalJt) updates.job_title = jt ? jt : null;
      if (startDate !== row.start_date) updates.start_date = startDate;
      if ((employmentStatus || "").trim() !== (row.employment_status || "").trim()) {
        updates.employment_status = employmentStatus.trim();
      }
      if (active !== !!row.active) updates.active = active;
      if (payrollCadence !== (row.payroll_cadence ?? "monthly")) updates.payroll_cadence = payrollCadence;

      await onSaveOffchain(updates);
      setLocalStatus(`✅ ${t.saved}`);
    } catch (e) {
      setLocalStatus(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setJobTitle(row.job_title ?? "");
    setStartDate(row.start_date);
    setEmploymentStatus(row.employment_status ?? "active");
    setActive(!!row.active);
    setPayrollCadence(row.payroll_cadence ?? "monthly");
    setLocalStatus("");
  }

  const runIdShort = computedRunId ? `${computedRunId.slice(0, 10)}…${computedRunId.slice(-8)}` : "—";

  return (
    <Card className="bg-card border-border col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              active
                ? "bg-success/10 text-success-foreground border-success/30 text-[10px]"
                : "bg-muted text-muted-foreground border-border text-[10px]"
            }
          >
            {active ? t.active : t.inactive}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono break-all">
          {t.wallet}: {String(row.wallet_address).toLowerCase() as Address}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Off-chain edits */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{t.offchainSectionTitle}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.jobTitle}</p>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t.jobTitlePlaceholder}
                className="bg-muted border-border text-foreground h-9 text-sm"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.startDate}</p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted border-border text-foreground h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.employmentStatus}</p>
              <Input
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                placeholder="active"
                className="bg-muted border-border text-foreground h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{t.employmentStatusHint}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4"
              />
              {t.activeToggle}
            </label>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.payrollCadenceLabel ?? "Payroll Cadence"}</p>
            <select
              value={payrollCadence}
              onChange={(e) => setPayrollCadence(e.target.value as PayrollCadence)}
              className="w-full bg-muted border-border text-foreground h-9 px-3 text-sm rounded"
            >
              {CADENCE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CADENCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => handleSave().catch(() => undefined)}
              disabled={saving || !dirty}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
            >
              {saving ? t.saving : t.saveChanges}
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              disabled={saving || !dirty}
              className="h-9 px-4 text-sm"
            >
              {t.reset}
            </Button>
            {dirty && <span className="text-[11px] text-muted-foreground">{t.unsavedChanges}</span>}
          </div>
        </div>

        {/* PII / Identity */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.piiSectionTitle ?? "Personal Identity (encrypted)"}
          </p>

          {identityLoading ? (
            <p className="text-xs text-muted-foreground">{t.loading ?? "Loading…"}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t.givenName ?? "First name"}
                  </p>
                  <Input
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    className="bg-muted border-border text-foreground h-9 text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t.familyName ?? "Last name"}
                  </p>
                  <Input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="bg-muted border-border text-foreground h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t.dniType ?? "ID type"}
                  </p>
                  <Input
                    value={dniType}
                    onChange={(e) => setDniType(e.target.value)}
                    placeholder="dni / passport"
                    className="bg-muted border-border text-foreground h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {t.dniValue ?? "ID number"}
                  </p>
                  <Input
                    value={dniValue}
                    onChange={(e) => setDniValue(e.target.value)}
                    className="bg-muted border-border text-foreground h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {t.email ?? "Email"}
                </p>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border text-foreground h-9 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleSavePii().catch(() => undefined)}
                  disabled={savingPii || !piiDirty}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
                >
                  {savingPii ? t.saving : (t.savePii ?? "Save identity")}
                </Button>
                {piiDirty && (
                  <span className="text-[11px] text-muted-foreground">{t.unsavedChanges}</span>
                )}
              </div>

              {piiStatus && (
                <div
                  className={`px-3 py-2 text-sm border ${
                    piiStatus.startsWith("✅")
                      ? "bg-success/10 text-success-foreground border-success/20"
                      : "bg-destructive/10 text-destructive-foreground border-destructive/20"
                  }`}
                >
                  {piiStatus}
                </div>
              )}
            </>
          )}
        </div>

        {/* Salary update */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{t.salarySectionTitle}</p>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {t.newSalary} ({underlyingSymbol})
              </p>
              <Input
                value={updateSalaryInput}
                onChange={(e) => setUpdateSalaryInput(e.target.value)}
                inputMode="decimal"
                className="bg-muted border-border text-foreground h-9 text-sm"
              />
            </div>
            <Button
              onClick={() => onUpdateSalary().catch(() => undefined)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
            >
              {t.updateSalary}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{t.salaryEncryptedHint}</p>
        </div>

        {/* Payroll actions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{t.payrollSectionTitle}</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.selectedPeriod}</p>
              <div className="bg-muted rounded px-3 py-2 text-sm">
                <span className="font-mono text-foreground">{computedPayrollPeriod.humanLabel}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.runId}</p>
              <div className="bg-muted rounded px-3 py-2 text-sm font-mono text-muted-foreground">{runIdShort}</div>
            </div>
          </div>
          <Button
            onClick={() => onRunPayrollSingle().catch(() => undefined)}
            disabled={!computedRunId}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
          >
            {t.runPayrollForThisEmployee}
          </Button>
        </div>

        {localStatus && (
          <div
            className={`px-3 py-2 text-sm border ${
              localStatus.startsWith("✅")
                ? "bg-success/10 text-success-foreground border-success/20"
                : "bg-destructive/10 text-destructive-foreground border-destructive/20"
            }`}
          >
            {localStatus}
          </div>
        )}
      </CardContent>
    </Card>
  );
}