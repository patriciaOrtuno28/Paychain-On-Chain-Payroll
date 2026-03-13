"use client";

import { type Address, parseUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import type { Locale } from "@/i18n-config";
import { useDictionary } from "@/lib/useDictionary";
import { useState } from "react";
import Link from "next/link";

interface EmployeeBalanceProps {
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

  // Unwrap
  userAddress?: Address;
  onRequestUnwrap: (amountRaw: bigint, toAddress: Address) => Promise<void>;
  isUnwrapping: boolean;

  // Status
  status: string;
}

export function EmployeeBalance({
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

  // Unwrap
  userAddress,
  onRequestUnwrap,
  isUnwrapping,

  // Status
  status,
}: EmployeeBalanceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [unwrapTo, setUnwrapTo] = useState("");
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
        currentPath={`/employee/balance`}
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{tBalance.title}</h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t.securedByFhe}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/${locale}`}>
                <Button variant="outline" className="border-border text-foreground hover:bg-accent h-9 px-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {tSidebar.backToHome}
                </Button>
              </Link>
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

        {/* Company Selection - Compact */}
        {bindings.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {tCompany.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        {/* Main Balance Card - Full Width */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {tBalance.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.balanceDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-8 border border-primary/20">
              <div className="text-center space-y-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                  {tBalance.handle}
                </p>

                {/* Encrypted Visual */}
                <div className="flex justify-center items-center gap-2 py-4">
                  <div className="flex items-center gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-primary/30 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Decrypt Button */}
                <div className="space-y-4">
                  <Button
                    onClick={onDecryptBalance}
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    disabled={!balanceHandle}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {tBalance.decryptButton}
                  </Button>

                  {!balanceHandle && (
                    <p className="text-xs text-muted-foreground">
                      {(tSidebar as any).noDataFound || "No balance data found. Make sure you are registered as an employee."}
                    </p>
                  )}
                </div>

                {/* Decrypted Result */}
                {balancePlain !== null && (
                  <div className="space-y-4">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <p className="text-xs text-success-foreground uppercase tracking-wider mb-2">
                        {(tSidebar as any).decryptedBalance || "Decrypted Balance"}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {balanceFormatted} {tokenSymbol}
                      </p>
                    </div>

                    {/* Convert to USDC */}
                    {balancePlain > 0n && (
                      <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4 text-left">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <p className="text-sm font-semibold text-foreground">Convert to USDC</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground font-medium">
                            Amount ({tokenSymbol})
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0.00"
                              value={unwrapAmount}
                              onChange={(e) => setUnwrapAmount(e.target.value)}
                              className="flex-1 bg-background"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUnwrapAmount(balanceFormatted ?? "")}
                              className="shrink-0 px-3"
                            >
                              Max
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground font-medium">
                            Destination wallet
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="0x..."
                              value={unwrapTo}
                              onChange={(e) => setUnwrapTo(e.target.value)}
                              className="flex-1 bg-background font-mono text-xs"
                            />
                            {userAddress && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUnwrapTo(userAddress)}
                                className="shrink-0 px-3 text-xs"
                              >
                                Mine
                              </Button>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={async () => {
                            if (!unwrapAmount || !unwrapTo) return;
                            const raw = parseUnits(unwrapAmount, tokenDecimals);
                            await onRequestUnwrap(raw, unwrapTo as Address);
                          }}
                          disabled={isUnwrapping || !unwrapAmount || !unwrapTo}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold"
                        >
                          {isUnwrapping ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Converting...
                            </span>
                          ) : (
                            `Convert to USDC`
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Runs automatically in 4 steps: encrypt → burn cUSDC → FHE gateway decryption → send USDC. Takes ~1–2 minutes total.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Payment Card */}
        {selectedPayroll && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground tracking-tight">
                {(tBalance as any).lastPaymentTitle || (tSidebar as any).lastPayment || "Last Payment"}
              </CardTitle>
              {lastRunId && (
                <p className="text-xs text-muted-foreground">
                  {tSalary.lastRunId}: <code className="font-mono text-xs">{lastRunId}</code>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-8 border border-border">
                <div className="text-center space-y-6">
                  <div className="flex justify-center items-center gap-2 py-2">
                    <div className="flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-muted-foreground/20 rounded-full animate-pulse" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={onDecryptLastPayment}
                      variant="outline"
                      className="h-12 px-8 text-base font-semibold transition-all duration-200"
                      disabled={!lastPaymentHandle}
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      {(tBalance as any).decryptLastPaymentButton || tSalary.decryptLastPayment || "Decrypt Last Payment"}
                    </Button>

                    {!lastPaymentHandle && (
                      <p className="text-xs text-muted-foreground">
                        {(tSidebar as any).noDataFound || "No payment data found yet."}
                      </p>
                    )}
                  </div>

                  {lastPaymentPlain !== null && (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <p className="text-xs text-success-foreground uppercase tracking-wider mb-2">
                        {(tSidebar as any).decryptedLastPayment || "Decrypted Last Payment"}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {lastPaymentFormatted} {tokenSymbol}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          <Link href={`/${locale}/employee/salary`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">My Salary</h3>
                <p className="text-sm text-muted-foreground">View salary information</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/employee/settings`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Settings</h3>
                <p className="text-sm text-muted-foreground">Network & preferences</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/employee/help`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{tSidebar.help}</h3>
                <p className="text-sm text-muted-foreground">{dict.common?.support}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
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
