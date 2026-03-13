"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

export default function EmployerOperatorPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict) return null;
  const t = dict.employerDashboard as any;

  const operatorBadgeText =
    ctx.operatorStatus === undefined
      ? dict.common?.active ?? "Active"
      : ctx.operatorStatus
      ? dict.common?.active ?? "Active"
      : dict.common?.inactive ?? "Inactive";

  const operatorBadgeClass =
    ctx.operatorStatus === false
      ? "bg-destructive/15 text-destructive-foreground border-destructive/30"
      : "bg-success/20 text-success-foreground border-success/30";

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/operator`}>
      <Card className="bg-gradient-to-br from-primary/10 via-background/80 to-background border border-border/30 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {t.operatorControls}
            </CardTitle>
            <Badge variant="default" className={`${operatorBadgeClass} text-[10px] px-2 py-0.5`}>
              {operatorBadgeText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t.isOperatorStatus}</p>
                <p className="text-xs text-muted-foreground">
                  {t.authorizedSession ??
                    "The payroll contract must be approved as an operator to move funds from your confidential balance."}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-3 bg-muted-foreground/20 rounded-sm" />
                <div className={`w-6 h-3 rounded-sm ${ctx.operatorStatus === false ? "bg-destructive" : "bg-primary"}`} />
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 my-4" />

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.renewalPeriodDays}</p>
            <div className="flex gap-2">
              <Input
                value={ctx.operatorDays}
                onChange={(e) => ctx.setOperatorDays(e.target.value)}
                className="bg-muted border-border text-foreground h-9 text-sm flex-1"
              />
              <Button onClick={ctx.onSetOperator} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm">
                {t.update}
              </Button>
            </div>
          </div>

          <Button
            variant="destructive"
            disabled
            className="w-full bg-destructive/10 text-destructive-foreground border border-destructive/20 hover:bg-destructive/20 h-9 text-sm mt-4 disabled:opacity-60"
            title={t.revokeNotImplemented ?? "Not implemented"}
          >
            {t.revokeAllAccess}
          </Button>
        </CardContent>
      </Card>
    </EmployerPageShell>
  );
}
