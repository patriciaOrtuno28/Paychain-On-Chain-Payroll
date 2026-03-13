"use client";

import { useEffect, useMemo, useState } from "react";
import { type Address } from "viem";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import type { EmployerRosterRow } from "@/lib/supabasePayroll";
import { DeleteCompanyButton } from "@/components/employer/DeleteCompanyButton";
import type { Locale } from "@/i18n-config";
import { useDictionary } from "@/lib/useDictionary";

import { RegisterEmployeeForm } from "./RegisterEmployeeForm";
import { EmployeeRoster } from "./EmployeeRoster";
import { EditEmployeePanel } from "./EditEmployeePanel";
import { PayrollConfirmModal } from "./PayrollConfirmModal";

type PayrollCadence = "monthly" | "semiMonthly" | "weekly";

interface EmployerDashboardProps {
  locale: Locale;

  // Platform + Company
  registryAddress?: string;
  wrapperAddress?: string;
  underlyingAddr?: string;
  wrapperRate?: string;
  payrollAddr: Address;
  hasCompany: boolean;
  companyName: string;
  chainId?: number;
  canUseFhe: boolean;
  backendSynced: boolean;
  supabaseError: string | null;

  // Funding
  underlyingSymbol: string;
  underlyingDecimalsValue: number;
  underlyingBalanceFormatted: string;
  wrapAmountInput: string;
  setWrapAmountInput: (value: string) => void;
  onApproveWrap: () => Promise<void>;
  onWrap: () => Promise<void>;

  // Confidential Balance
  employerBalHandle?: string;
  employerConfidentialBalanceFormatted: string | null;
  onDecryptBalance: () => Promise<void>;

  // Operator
  operatorStatus?: boolean;
  operatorDays: string;
  setOperatorDays: (value: string) => void;
  onSetOperator: () => Promise<void>;

  // Provision Employee (kept for compatibility, unused visually)
  newEmployeeWallet: string;
  setNewEmployeeWallet: (value: string) => void;
  newEmployeeSalary: string;
  setNewEmployeeSalary: (value: string) => void;
  newEmployeePeriod: string;
  setNewEmployeePeriod: (value: string) => void;
  onAddUser: () => Promise<void>;
  onSetSalary: () => Promise<void>;
  payrollAbi: any;
  companyBinding: any;
  companyOnchainBindingId: string;
  onSuccess: any;

  // Roster
  rosterRows: EmployerRosterRow[];
  rosterLoading: boolean;
  selectedEmployee: Address | "";
  onSelectEmployee: (addr: Address) => void;
  onRemoveEmployee: (row: EmployerRosterRow) => void;
  onUpdateEmployeeOffchain: (
    row: EmployerRosterRow,
    updates: {
      job_title?: string | null;
      employment_status?: string;
      start_date?: string;
      end_date?: string | null;
      active?: boolean;
    }
  ) => Promise<void>;

  // Payroll Run (single selected preview)
  computedEmployeePayrollPeriod: { humanLabel: string; id: bigint };
  computedEmployeeRunId: string | null;
  onRunPayrollSingle: () => Promise<void>;

  // Payroll Run (batch all active, grouped by cadence in page.tsx)
  onRunPayrollBatch: (referenceDateUtc: string) => Promise<void>;
  activeEmployeeCount: number;

  // Confidential View
  selectedSalaryHandle?: string;
  selectedLastPaymentHandle?: string;
  selectedLastPaidPeriod?: string;
  selectedSalaryPlain: bigint | null;
  selectedLastPaymentPlain: bigint | null;
  selectedSalaryFormatted: string | null;
  selectedLastPaymentFormatted: string | null;
  onDecryptSalary: () => Promise<void>;
  onDecryptLastPayment: () => Promise<void>;
  updateSalaryInput: string;
  setUpdateSalaryInput: (value: string) => void;
  onUpdateSalary: () => Promise<void>;

  // Export
  onExportCsv: () => void;

  // Delete company
  onDeleteCompany: () => Promise<void>;

  // Status
  status: string;
}

export function EmployerDashboard({
  locale,
  payrollAddr,
  hasCompany,
  companyName,
  canUseFhe,
  backendSynced,
  supabaseError,

  // Funding
  underlyingAddr,
  underlyingSymbol,
  underlyingDecimalsValue,
  underlyingBalanceFormatted,
  wrapAmountInput,
  setWrapAmountInput,
  onApproveWrap,
  onWrap,

  // Confidential Balance
  employerConfidentialBalanceFormatted,
  onDecryptBalance,

  // Operator
  operatorStatus,
  operatorDays,
  setOperatorDays,
  onSetOperator,

  // Register employee
  payrollAbi,
  companyOnchainBindingId,
  onSuccess,

  // Roster
  rosterRows,
  rosterLoading,
  selectedEmployee,
  onSelectEmployee,
  onRemoveEmployee,
  onUpdateEmployeeOffchain,

  // Payroll Run
  computedEmployeePayrollPeriod,
  computedEmployeeRunId,
  onRunPayrollSingle,
  onRunPayrollBatch,
  activeEmployeeCount,

  // Confidential View
  selectedSalaryPlain,
  selectedLastPaymentPlain,
  selectedSalaryFormatted,
  selectedLastPaymentFormatted,
  onDecryptSalary,
  onDecryptLastPayment,
  updateSalaryInput,
  setUpdateSalaryInput,
  onUpdateSalary,

  // Export
  onExportCsv,

  // Delete company
  onDeleteCompany,

  // Status
  status,
}: EmployerDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dict = useDictionary(locale);

  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const selectedRow = useMemo(() => {
    if (!selectedEmployee) return null;
    const sel = String(selectedEmployee).toLowerCase();
    return rosterRows.find((r) => String(r.wallet_address).toLowerCase() === sel) ?? null;
  }, [rosterRows, selectedEmployee]);

  const activeCadenceCount = useMemo(() => {
    const set = new Set<string>();
    for (const r of rosterRows) {
      if (!r.active) continue;
      const c = (r as any).payroll_cadence as PayrollCadence | undefined;
      set.add(c ?? "monthly");
    }
    return set.size;
  }, [rosterRows]);

  if (!dict) return null;
  const t = dict.employerDashboard as any;

  const operatorBadgeText =
    operatorStatus === undefined
      ? dict.common?.active ?? "Active"
      : operatorStatus
        ? dict.common?.active ?? "Active"
        : dict.common?.inactive ?? "Inactive";

  const operatorBadgeClass =
    operatorStatus === false
      ? "bg-destructive/15 text-destructive-foreground border-destructive/30"
      : "bg-success/20 text-success-foreground border-success/30";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PayrollConfirmModal
        open={showPayrollModal}
        onOpenChange={setShowPayrollModal}
        payrollAddr={payrollAddr}
        operatorStatus={operatorStatus}
        operatorDays={operatorDays}
        activeEmployeeCount={activeEmployeeCount}
        activeCadenceCount={activeCadenceCount}
        selectedEmployee={selectedEmployee}
        onRunBatch={onRunPayrollBatch}
        onRunSingle={onRunPayrollSingle}
        onScrollToOperator={() => {
          const el = document.getElementById("operator-controls");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* Sidebar */}
      <Sidebar
        locale={locale}
        variant="employer"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={`/employer`}
      />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.title}</h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t.securedByFhe}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />

              <Button
                variant="outline"
                onClick={onExportCsv}
                className="border-border text-foreground hover:bg-accent h-9 px-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.exportCsv}
              </Button>

              <Button
                onClick={() => setShowPayrollModal(true)}
                disabled={activeEmployeeCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6"
                title={activeEmployeeCount === 0 ? (t.runDisabledNoEmployees ?? "No active employees to pay.") : ""}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.runPayrollBatch ?? "Run payroll (batch)"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Status */}
        {status && (
          <div
            className={`px-4 py-3 border text-sm ${
              status.startsWith("✅")
                ? "bg-success/10 text-success-foreground border-success/20"
                : "bg-destructive/10 text-destructive-foreground border-destructive/20"
            }`}
          >
            {status}
          </div>
        )}

        {/* Alerts */}
        {!hasCompany && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-destructive-foreground">{t.noCompanyWarning}</p>
            </CardContent>
          </Card>
        )}

        {hasCompany && !backendSynced && (
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-warning-foreground">{t.supabaseNotSynced}</p>
            </CardContent>
          </Card>
        )}

        {supabaseError && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-destructive-foreground">
                {t.supabaseError}: {supabaseError}
              </p>
            </CardContent>
          </Card>
        )}

        {/* NEW: Payroll explainer (replaces misleading payroll period section) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {t.howPayrollWorksTitle ?? "How payroll works"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {t.activeEmployeesLabel ?? "Active employees"}: {activeEmployeeCount}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {t.cadenceGroupsLabel ?? "Cadence groups"}: {activeCadenceCount}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {t.howPayrollWorksLine1 ??
                "This contract does not schedule payments. Payroll executes immediately when you confirm and the transaction is mined."}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                {t.howPayrollWorksBullet1 ??
                  "You set each employee’s encrypted salary. The contract can pay only that encrypted amount."}
              </li>
              <li>
                {t.howPayrollWorksBullet2 ??
                  "Batch payroll is grouped by employee cadence (monthly/weekly/etc). Each cadence group may require a separate on-chain transaction."}
              </li>
              <li>
                {t.howPayrollWorksBullet3 ??
                  "To avoid double paying, each run uses a runId. The contract blocks paying the same employee twice for the same runId."}
              </li>
              <li>
                {t.howPayrollWorksBullet4 ??
                  "Operator approval is required so the payroll contract can move funds from your confidential balance to employees."}
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              {t.howPayrollWorksFootnote ??
                "The roster can show a ‘next due’ hint based on off-chain cadence settings. On-chain, only ‘already paid in this runId’ is enforced."}
            </p>
          </CardContent>
        </Card>

        {/* Funding */}
        <Card className="bg-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {t.fundingSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.fundingSection.underlyingLabel}</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{String(underlyingAddr ?? "(loading)")}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.fundingSection.symbolLabel}</span>
                <span className="text-xs">{underlyingSymbol ?? "USDC"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.fundingSection.decimalsLabel}</span>
                <span className="text-xs">{String(underlyingDecimalsValue ?? "(loading)")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.fundingSection.balanceLabel}</span>
                <Badge variant="default">
                  {underlyingBalanceFormatted} {underlyingSymbol}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {t.fundingSection.amountToWrapLabel} ({underlyingSymbol})
              </label>
              <Input
                value={wrapAmountInput}
                onChange={(e) => setWrapAmountInput(e.target.value)}
                placeholder="100"
                type="number"
                className="bg-background"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={onApproveWrap} variant="outline" size="sm">
                {t.fundingSection.approveButton}
              </Button>
              <Button onClick={onWrap} variant="default" size="sm">
                {t.fundingSection.wrapButton}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{t.fundingSection.flowNote}</p>
          </CardContent>
        </Card>

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Confidential Treasury */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {t.confidentialTreasury}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background rounded p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.encryptedBalance}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                    ))}
                  </div>
                  <Button
                    onClick={onDecryptBalance}
                    variant="outline"
                    className="bg-transparent border-primary text-primary hover:bg-primary/10 h-8 px-3 text-xs"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {t.decrypt}
                  </Button>
                </div>

                {employerConfidentialBalanceFormatted !== null && (
                  <p className="text-lg font-mono text-foreground mt-3">
                    {employerConfidentialBalanceFormatted} {underlyingSymbol}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.decryptionNote}</p>
            </CardContent>
          </Card>

          {/* Employee Roster */}
          <div className="col-span-2">
            <EmployeeRoster
              rows={rosterRows}
              loading={rosterLoading}
              onSelect={onSelectEmployee}
              onRemove={onRemoveEmployee}
              t={dict.employeeRoster}
              selectedEmployee={selectedEmployee}
              onSelectEmployee={onSelectEmployee}
              onDecryptSalary={onDecryptSalary}
              onDecryptLastPayment={onDecryptLastPayment}
              selectedSalaryPlain={selectedSalaryPlain}
              selectedSalaryFormatted={selectedSalaryFormatted}
              selectedLastPaymentPlain={selectedLastPaymentPlain}
              selectedLastPaymentFormatted={selectedLastPaymentFormatted}
              underlyingSymbol={underlyingSymbol}
              tConfidential={{
                confidentialView: t.confidentialView,
                salaryPlaintext: t.salaryPlaintext,
                historyDecryption: t.historyDecryption,
                decryptionWarning: t.decryptionWarning,
              }}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <RegisterEmployeeForm
              payrollAddr={payrollAddr}
              payrollAbi={payrollAbi!}
              companyOnchainBindingId={companyOnchainBindingId}
              underlyingDecimals={underlyingDecimalsValue}
              underlyingSymbol={underlyingSymbol}
              onSuccess={onSuccess}
              t={dict.registerEmployeeForm}
            />
          </div>

          {/* Operator Controls */}
          <Card id="operator-controls" className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  {t.operatorControls}
                </CardTitle>

                <Badge
                  variant="default"
                  className={`text-[10px] px-2 py-0.5 ${
                    operatorStatus === false
                      ? "bg-destructive/15 text-destructive-foreground border-destructive/30"
                      : "bg-success/20 text-success-foreground border-success/30"
                  }`}
                >
                  {operatorStatus === false ? (dict.common?.inactive ?? "Inactive") : (dict.common?.active ?? "Active")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted rounded p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t.isOperatorStatus}
                </p>
                <p className="text-xs text-muted-foreground">
                  {operatorStatus === false
                    ? (t.operatorExplainInactive ??
                        "Inactive means the Payroll contract cannot move funds from your confidential balance. Payroll runs will revert until you grant operator approval.")
                    : (t.operatorExplainActive ??
                        "Active means the Payroll contract is allowed to transfer confidential tokens from your balance to employees during payroll runs.")}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {t.renewalPeriodDays}
                </p>

                <div className="flex gap-2">
                  <Input
                    value={operatorDays}
                    onChange={(e) => setOperatorDays(e.target.value)}
                    className="bg-muted border-border text-foreground h-9 text-sm flex-1"
                  />

                  <Button
                    onClick={onSetOperator}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
                  >
                    {operatorStatus ? (t.renewOperator ?? "RENEW OPERATOR") : (t.enableOperator ?? "ENABLE OPERATOR")}
                  </Button>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.operatorExplain ??
                      "This approval allows the Payroll contract to transfer confidential tokens from your employer wallet only when you confirm a payroll transaction. You can revoke/expire it anytime by letting it lapse."}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {operatorStatus === false
                    ? (t.operatorCtaHintInactive ??
                        "This will submit a transaction to approve the Payroll contract as operator until the expiry you choose (in days).")
                    : (t.operatorCtaHintActive ??
                        "Submitting again extends the expiry. You can keep this short (e.g., 7–14 days) and renew as needed.")}
                </p>
              </div>

              <Button
                variant="destructive"
                disabled
                className="w-full bg-destructive/10 text-destructive-foreground border border-destructive/20 hover:bg-destructive/20 h-9 text-sm mt-2 disabled:opacity-60"
                title={t.revokeNotImplemented ?? "Not implemented"}
              >
                {t.revokeAllAccess}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Edit Employee Panel */}
          <div className="col-span-2">
            {selectedRow ? (
              <EditEmployeePanel
                row={selectedRow}
                onSaveOffchain={(updates) => onUpdateEmployeeOffchain(selectedRow, updates)}
                underlyingSymbol={underlyingSymbol}
                updateSalaryInput={updateSalaryInput}
                setUpdateSalaryInput={setUpdateSalaryInput}
                onUpdateSalary={onUpdateSalary}
                computedPayrollPeriod={computedEmployeePayrollPeriod}
                computedRunId={computedEmployeeRunId}
                onRunPayrollSingle={onRunPayrollSingle}
                t={dict.editEmployeePanel}
              />
            ) : (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    {t.editEmployeeTitle ?? "Edit employee"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground">
                    {t.editEmployeeEmptyState ?? "Select an employee from the roster to edit off-chain fields and update salary."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.editEmployeeEmptyStateHint ?? "Tip: clicking a row in the roster will select it."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Confidential View */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {t.confidentialView}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.selectEmployee}</p>
                <select
                  value={selectedEmployee}
                  onChange={(e) => onSelectEmployee(e.target.value as Address)}
                  className="w-full bg-background border-border text-foreground h-9 px-3 text-sm font-mono rounded"
                >
                  <option value="">{t.selectFromRoster}</option>
                  {rosterRows.map((row) => (
                    <option key={row.wallet_address} value={row.wallet_address}>
                      {row.wallet_address.slice(0, 6)}...{row.wallet_address.slice(-4)}
                      {row.job_title ? ` — ${row.job_title}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  <div className="bg-background rounded p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.salaryPlaintext}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                        ))}
                      </div>
                      <Button
                        onClick={onDecryptSalary}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-primary hover:bg-primary/10"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      </Button>
                    </div>
                    {selectedSalaryPlain !== null && (
                      <p className="text-sm font-mono text-foreground mt-2">
                        {selectedSalaryFormatted} {underlyingSymbol}
                      </p>
                    )}
                  </div>

                  <div className="bg-background rounded p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.historyDecryption}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                        ))}
                      </div>
                      <Button
                        onClick={onDecryptLastPayment}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-primary hover:bg-primary/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </Button>
                    </div>
                    {selectedLastPaymentPlain !== null && (
                      <p className="text-sm font-mono text-foreground mt-2">
                        {selectedLastPaymentFormatted} {underlyingSymbol}
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed whitespace-pre-line">
                    {t.decryptionWarning}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Danger Zone */}
      {hasCompany && (
        <div className="max-w-[1400px] mx-auto px-6 mb-8">
          <DeleteCompanyButton companyName={companyName} onDeleteCompany={onDeleteCompany} />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 bg-success rounded-sm" />
                {t.zamaDevnet}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.latency}
              </span>
            </div>
            <p className="text-muted-foreground">{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}