"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDictionary } from "@/lib/useDictionary";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";

export default function EmployerDashboardPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict) return null;
  const t = dict.employerDashboard as any;
  const s = dict.employerSidebar as any;
  const locale = ctx.locale;

  const groups = [
    {
      title: "Balance & Treasury",
      description: "Manage your token balances and confidential encrypted funds.",
      items: [
        {
          label: s.funding,
          href: `/${locale}/employer/funding`,
          description: "Approve and wrap ERC-20 tokens into confidential USDC to fund payroll.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1" />
            </svg>
          ),
        },
        {
          label: s.treasury,
          href: `/${locale}/employer/treasury`,
          description: "View and decrypt your confidential on-chain balance using FHE.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4.5v5.5c0 5-3.07 8.66-7 10-3.93-1.34-7-5-7-10V6.5L12 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11h2v2h-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Employee Management",
      description: "Add, view, edit and remove employees from your payroll roster.",
      items: [
        {
          label: s.roster,
          href: `/${locale}/employer/roster`,
          description: "See all active and inactive employees, their cadence, next due date, and decrypt individual salaries.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          label: s.registerEmployee,
          href: `/${locale}/employer/register`,
          description: "Register a new employee by providing their wallet address, job title, salary and pay cadence.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          ),
        },
        {
          label: s.editEmployee,
          href: `/${locale}/employer/edit`,
          description: "Update an employee's job title, status, dates or encrypted salary on-chain.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Payroll Controls",
      description: "Configure operator permissions and payroll execution settings.",
      items: [
        {
          label: s.operator,
          href: `/${locale}/employer/operator`,
          description: "Grant the payroll contract operator approval to transfer encrypted tokens from your balance during payroll runs.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1l3 6h6v11a3 3 0 01-3 3H6a3 3 0 01-3-3V7h6l3-6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13l2 2 4-4" />
            </svg>
          ),
        },
        {
          label: s.settings,
          href: `/${locale}/employer/settings`,
          description: "View contract addresses, chain info and other advanced configuration.",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <EmployerPageShell currentPath={`/${locale}/employer/dashboard`}>
      {/* How payroll works */}
      <Card className="bg-gradient-to-br from-primary/10 via-background/80 to-background border border-border/30 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {t.howPayrollWorksTitle ?? "How payroll works"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {t.activeEmployeesLabel ?? "Active employees"}: {ctx.activeEmployeeCount}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {t.cadenceGroupsLabel ?? "Cadence groups"}: {ctx.activeCadenceCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <div className="border-t border-border/30 my-3" />
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {t.howPayrollWorksLine1 ??
              "This contract does not schedule payments. Payroll executes immediately when you confirm and the transaction is mined."}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              {t.howPayrollWorksBullet1 ??
                "You set each employee's encrypted salary. The contract can pay only that encrypted amount."}
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
              "The roster can show a 'next due' hint based on off-chain cadence settings. On-chain, only 'already paid in this runId' is enforced."}
          </p>
        </CardContent>
      </Card>

      {/* Quick access */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                    <CardContent className="pt-4 pb-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </EmployerPageShell>
  );
}
