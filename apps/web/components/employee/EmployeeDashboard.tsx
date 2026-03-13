"use client";

import { type Address } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import type { Locale } from "@/i18n-config";
import { useDictionary } from "@/lib/useDictionary";
import { useState } from "react";

interface EmployeeDashboardProps {
  locale: Locale;
  // Network state
  chainId?: number;
  canUseFhe: boolean;
  tokenSymbol: string;
  tokenDecimals: number;
  underlyingAddr?: Address;

  // Company selection
  bindings: any[];
  bindingsLoading: boolean;
  bindingsError: string | null;
  selectedPayroll: Address | "";
  onSelectPayroll: (addr: Address | "") => void;

  // Salary
  salaryHandle?: string;
  salaryPlain: bigint | null;
  salaryFormatted: string | null;
  onDecryptSalary: () => Promise<void>;

  // Last payment
  lastPaymentHandle?: string;
  lastPaymentPlain: bigint | null;
  lastPaymentFormatted: string | null;
  lastRunId?: string;
  onDecryptLastPayment: () => Promise<void>;

  // Balance
  balanceHandle?: string;
  balancePlain: bigint | null;
  balanceFormatted: string | null;
  onDecryptBalance: () => Promise<void>;

  // Status
  status: string;
}

export function EmployeeDashboard({
  locale,
  // Network state
  chainId,
  canUseFhe,
  tokenSymbol,
  tokenDecimals,
  underlyingAddr,

  // Company selection
  bindings,
  bindingsLoading,
  bindingsError,
  selectedPayroll,
  onSelectPayroll,

  // Salary
  salaryHandle,
  salaryPlain,
  salaryFormatted,
  onDecryptSalary,

  // Last payment
  lastPaymentHandle,
  lastPaymentPlain,
  lastPaymentFormatted,
  lastRunId,
  onDecryptLastPayment,

  // Balance
  balanceHandle,
  balancePlain,
  balanceFormatted,
  onDecryptBalance,

  // Status
  status,
}: EmployeeDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dict = useDictionary(locale);

  if (!dict) {
    return null;
  }

  const t = dict.employeePage;
  const tCompany = dict.employeeCompanySelector;
  const tSalary = dict.employeeSalaryPanel;
  const tBalance = dict.employeeBalancePanel;
  const tSidebar = dict.employeeSidebar as any;

  const selectedBinding = bindings.find(
    (b) => b.payroll_contract_address === selectedPayroll
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        locale={locale}
        variant="employee"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={`/employee`}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Status Message */}
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

        {/* Salary Card - Most important, shown first and prominent */}
        <Card id="salary" className="bg-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {tSalary.salaryTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-md p-6 border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {tSalary.handle}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full" />
                  ))}
                </div>
                <Button
                  onClick={onDecryptSalary}
                  variant="outline"
                  className="bg-transparent border-primary text-primary hover:bg-primary/10 h-9 px-4 text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                  {tSalary.decryptSalary}
                </Button>
              </div>
              {salaryPlain !== null && (
                <p className="text-2xl font-mono text-foreground mt-4">
                  {salaryFormatted} {tokenSymbol}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Selection & Last Payment Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Company Selection Card */}
          <Card id="company" className="bg-card border-primary/30">
            <CardHeader>
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {tCompany.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bindingsLoading && (
                <div className="text-sm text-muted-foreground">
                  {tCompany.loading}
                </div>
              )}

              {bindingsError && (
                <div className="text-destructive text-sm">
                  {tCompany.errorPrefix}: {bindingsError}
                </div>
              )}

              {!bindingsLoading && !bindingsError && bindings.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {tCompany.noAssociation}
                  <br />
                  <small className="text-muted-foreground/70">{tCompany.noAssociationHint}</small>
                </div>
              )}

              {!bindingsLoading && !bindingsError && bindings.length > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {tCompany.foundContracts}: <b className="text-foreground">{bindings.length}</b>
                  </div>

                  {bindings.length === 1 ? (
                    <div className="bg-muted rounded-md p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{tCompany.company}</span>
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          {bindings[0].company_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{tCompany.payrollContract}</span>
                        <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                          {bindings[0].payroll_contract_address.slice(0, 10)}...
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        {tCompany.selectCompany}
                      </label>
                      <select
                        value={selectedPayroll}
                        onChange={(e) => onSelectPayroll(e.target.value as Address)}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">{tCompany.selectPlaceholder}</option>
                        {bindings.map((b) => (
                          <option key={b.payroll_contract_address} value={b.payroll_contract_address}>
                            {b.company_name} — {b.payroll_contract_address.slice(0, 10)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedBinding && (
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-md p-4 space-y-3 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{tCompany.company}</span>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          {selectedBinding.company_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{tCompany.payrollContract}</span>
                        <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                          {selectedBinding.payroll_contract_address}
                        </code>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Last Payment Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {tSalary.lastPaymentTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background rounded-md p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {tSalary.handle}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                    ))}
                  </div>
                  <Button
                    onClick={onDecryptLastPayment}
                    variant="outline"
                    className="bg-transparent border-primary text-primary hover:bg-primary/10 h-8 px-3 text-xs"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {tSalary.decryptLastPayment}
                  </Button>
                </div>
                {lastPaymentPlain !== null && (
                  <p className="text-lg font-mono text-foreground mt-3">
                    {lastPaymentFormatted} {tokenSymbol}
                  </p>
                )}
                {lastRunId && lastRunId !== "(none)" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {tSalary.lastRunId}: <code className="font-mono">{lastRunId}</code>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confidential Balance Card */}
        <Card id="balance" className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {tBalance.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-md p-6 border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                {tBalance.handle}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full" />
                    ))}
                  </div>
                  <Button
                    onClick={onDecryptBalance}
                    variant="outline"
                    className="bg-transparent border-primary text-primary hover:bg-primary/10 h-9 px-4 text-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {tBalance.decryptButton}
                  </Button>
                </div>
              </div>
              {balancePlain !== null && (
                <p className="text-2xl font-mono text-foreground mt-4">
                  {balanceFormatted} {tokenSymbol}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tBalance.note}
            </p>
          </CardContent>
        </Card>

        {/* Network Status Card - Least important, shown last */}
        <Card id="settings" className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {t.networkTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.chainId}</span>
                <Badge variant={canUseFhe ? "default" : "secondary"} className="text-xs">
                  {canUseFhe ? t.fheEnabled : t.fheDisabled}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.token}</span>
                <span className="font-mono text-xs">
                  {tokenSymbol} ({String(underlyingAddr ?? t.loading)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card id="help" className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {tSidebar.help}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                {tSidebar.needHelp}
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">{tSidebar.quickLinks}</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {dict.common?.documentation || "Documentation"}</li>
                  <li>• {dict.common?.support || "Support"}</li>
                  <li>• {dict.common?.api || "API"}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 bg-success rounded-sm" />
                {dict.common.devnetActive}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {dict.employerDashboard.latency}
              </span>
            </div>
            <p className="text-muted-foreground">{dict.common.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
