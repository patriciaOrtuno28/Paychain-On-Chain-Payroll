"use client";

import { type Address } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import type { Locale } from "@/i18n-config";
import { useDictionary } from "@/lib/useDictionary";
import { useState } from "react";
import Link from "next/link";

interface EmployeeHelpProps {
  locale: Locale;
  // Status
  status: string;
}

export function EmployeeHelp({
  locale,
  // Status
  status,
}: EmployeeHelpProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dict = useDictionary(locale);

  if (!dict) {
    return null;
  }

  const t = dict.employeePage;
  const tSidebar = dict.employeeSidebar as any;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        locale={locale}
        variant="employee"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={`/employee/help`}
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{tSidebar.help}</h1>
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

        {/* Help Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {tSidebar.needHelp}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.needHelp}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Getting Started */}
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{tSidebar.gettingStarted}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tSidebar.gettingStartedDesc}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {tSidebar.connectWallet}</li>
                    <li>• {tSidebar.selectCompany}</li>
                    <li>• {tSidebar.decryptSalary}</li>
                    <li>• {tSidebar.viewBalance}</li>
                  </ul>
                </div>
              </div>

              {/* Security & Privacy */}
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{tSidebar.securityPrivacy}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tSidebar.securityPrivacyDesc}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {tSidebar.endToEndEncryption}</li>
                    <li>• {tSidebar.privateKeyControl}</li>
                    <li>• {tSidebar.zeroKnowledgeProofs}</li>
                    <li>• {tSidebar.onchainConfidentiality}</li>
                  </ul>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{tSidebar.troubleshooting}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tSidebar.troubleshootingDesc}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {tSidebar.connectionProblems}</li>
                    <li>• {tSidebar.decryptionFailures}</li>
                    <li>• {tSidebar.balanceNotShowing}</li>
                    <li>• {tSidebar.walletIssues}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {tSidebar.faqTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.faqDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="border-l-4 border-primary/30 pl-4">
                <h4 className="font-semibold text-foreground mb-2">{tSidebar.faqDecryptSalary}</h4>
                <p className="text-sm text-muted-foreground">
                  {tSidebar.faqDecryptSalaryAns}
                </p>
              </div>
              <div className="border-l-4 border-primary/30 pl-4">
                <h4 className="font-semibold text-foreground mb-2">{tSidebar.faqFhe}</h4>
                <p className="text-sm text-muted-foreground">
                  {tSidebar.faqFheAns}
                </p>
              </div>
              <div className="border-l-4 border-primary/30 pl-4">
                <h4 className="font-semibold text-foreground mb-2">{tSidebar.faqSecurity}</h4>
                <p className="text-sm text-muted-foreground">
                  {tSidebar.faqSecurityAns}
                </p>
              </div>
              <div className="border-l-4 border-primary/30 pl-4">
                <h4 className="font-semibold text-foreground mb-2">{tSidebar.faqEmployerSee}</h4>
                <p className="text-sm text-muted-foreground">
                  {tSidebar.faqEmployerSeeAns}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              {tSidebar.quickLinks}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.quickLinks}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="#" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-medium text-foreground">{dict.common?.documentation || "Documentation"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Complete technical documentation</p>
              </a>
              <a href="#" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-foreground">{dict.common?.support || "Support"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Get help from our support team</p>
              </a>
              <a href="#" className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="font-medium text-foreground">{dict.common?.api || "API"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Developer API documentation</p>
              </a>
            </div>
          </CardContent>
        </Card>

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
