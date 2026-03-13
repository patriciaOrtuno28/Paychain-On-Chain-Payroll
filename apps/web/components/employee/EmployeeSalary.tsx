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
import Link from "next/link";

interface EmployeeSalaryProps {
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

  // Status
  status: string;
}

export function EmployeeSalary({
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

  // Status
  status,
}: EmployeeSalaryProps) {
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
        currentPath={`/employee/salary`}
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{tSalary.salaryTitle}</h1>
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

        {/* Enhanced Salary Card - Main Focus */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {tSalary.salaryTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.salaryDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-background to-muted/20 rounded-xl p-8 border border-primary/20">
              <div className="text-center space-y-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                  {tSalary.handle}
                </p>
                
                {/* Encrypted Visual */}
                <div className="flex justify-center items-center gap-2 py-4">
                  <div className="flex items-center gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-primary/30 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Decrypt Button - Enhanced */}
                <div className="space-y-4">
                  <Button
                    onClick={onDecryptSalary}
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    disabled={!salaryHandle || !selectedPayroll}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {tSalary.decryptSalary}
                  </Button>
                  
                  {!salaryHandle && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPayroll ? 
                        tSidebar.noDataFound || "No salary data found. Make sure you are registered as an employee." :
                        tSidebar.selectCompanyToView
                      }
                    </p>
                  )}
                </div>

                {/* Decrypted Result */}
                {salaryPlain !== null && (
                  <div className="space-y-3">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <p className="text-xs text-success-foreground uppercase tracking-wider mb-2">
                        {tSidebar.decryptedSalary}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {salaryFormatted} {tokenSymbol}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tSidebar.salaryNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          <Link href={`/${locale}/employee/balance`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">My Balance</h3>
                <p className="text-sm text-muted-foreground">View accumulated funds</p>
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
