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

interface EmployeeSettingsProps {
  locale: Locale;
  // Network state
  chainId?: number;
  canUseFhe: boolean;
  tokenSymbol: string;
  tokenDecimals: number;
  underlyingAddr?: Address;

  // Status
  status: string;
}

export function EmployeeSettings({
  locale,
  // Network state
  chainId,
  canUseFhe,
  tokenSymbol,
  tokenDecimals,
  underlyingAddr,

  // Status
  status,
}: EmployeeSettingsProps) {
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
        currentPath={`/employee/settings`}
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
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

        {/* Network Status Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              Network Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current blockchain network and token configuration
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Chain ID</span>
                  <Badge variant={canUseFhe ? "default" : "secondary"} className="text-sm">
                    {chainId || "Loading..."}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">FHE Status</span>
                  <Badge variant={canUseFhe ? "default" : "secondary"} className="text-sm">
                    {canUseFhe ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Token Symbol</span>
                  <span className="font-mono text-sm bg-background px-3 py-1 rounded border">
                    {tokenSymbol || "Loading..."}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Token Address</span>
                  <code className="text-xs bg-background px-3 py-1 rounded font-mono border">
                    {String(underlyingAddr || "Loading...")}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              Preferences
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.preferencesDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">{tSidebar.preferencesTitle}</h4>
                  <p className="text-sm text-muted-foreground">{tSidebar.themeDesc}</p>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">Language</h4>
                  <p className="text-sm text-muted-foreground">{tSidebar.languageDesc}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              Security
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {tSidebar.securityDesc}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground">{tSidebar.securityTitle}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span className="text-sm text-muted-foreground">{tSidebar.encryptionActive}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tSidebar.encryptionNote}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground">{tSidebar.walletConnection}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span className="text-sm text-muted-foreground">{tSidebar.connectionEstablished}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tSidebar.connectionNote}
                </p>
              </div>
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
