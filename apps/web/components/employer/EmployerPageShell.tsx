"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Children, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PayrollConfirmModal } from "@/components/employer/PayrollConfirmModal";
import { useDictionary } from "@/lib/useDictionary";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";

interface EmployerPageShellProps {
  currentPath: string;
  children: React.ReactNode;
}

export function EmployerPageShell({ currentPath, children }: EmployerPageShellProps) {
  const router = useRouter();
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  if (!dict) return null;
  const t = dict.employerDashboard as any;
  const content = Children.toArray(children);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PayrollConfirmModal
        open={showPayrollModal}
        onOpenChange={setShowPayrollModal}
        payrollAddr={ctx.payrollAddr}
        operatorStatus={ctx.operatorStatus}
        operatorDays={ctx.operatorDays}
        activeEmployeeCount={ctx.activeEmployeeCount}
        activeCadenceCount={ctx.activeCadenceCount}
        selectedEmployee={ctx.selectedEmployee}
        onRunBatch={ctx.onRunPayrollBatch}
        onRunSingle={ctx.onRunPayrollSingle}
        onScrollToOperator={() => {
          setShowPayrollModal(false);
          router.push(`/${ctx.locale}/employer/operator`);
        }}
      />

      <Sidebar
        locale={ctx.locale}
        variant="employer"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
      />

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
              <Link href={`/${ctx.locale}`}>
                <Button variant="outline" className="border-border text-foreground hover:bg-accent h-9 px-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t.backToHome ?? "Back to Home"}
                </Button>
              </Link>
              <ThemeToggle />
              <LanguageSwitcher />
              <Button
                variant="outline"
                onClick={ctx.onExportCsv}
                className="border-border text-foreground hover:bg-accent h-9 px-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.exportCsv}
              </Button>
              <Button
                onClick={() => setShowPayrollModal(true)}
                disabled={ctx.activeEmployeeCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6"
                title={
                  ctx.activeEmployeeCount === 0
                    ? t.runDisabledNoEmployees ?? "No active employees to pay."
                    : undefined
                }
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.runPayroll ?? "Run payroll"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {ctx.status && (
          <div
            className={`px-4 py-3 border text-sm ${
              ctx.status.startsWith("✅")
                ? "bg-success/10 text-success-foreground border-success/20"
                : "bg-destructive/10 text-destructive-foreground border-destructive/20"
            }`}
          >
            {ctx.status}
          </div>
        )}

        {!ctx.hasCompany && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-destructive-foreground">{t.noCompanyWarning}</p>
            </CardContent>
          </Card>
        )}

        {ctx.hasCompany && !ctx.backendSynced && (
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-warning-foreground">{t.supabaseNotSynced}</p>
            </CardContent>
          </Card>
        )}

        {ctx.supabaseError && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-destructive-foreground">
                {t.supabaseError}: {ctx.supabaseError}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pt-2">
          <div className="h-[3px] w-28 rounded-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
        </div>

        <div className="space-y-6 divide-y divide-border/20">
          {content.map((child, index) => (
            <div key={index} className={index > 0 ? "pt-6" : ""}>
              {child}
            </div>
          ))}
        </div>
      </main>

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
