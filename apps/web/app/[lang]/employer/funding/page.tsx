"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

export default function EmployerFundingPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict) return null;
  const t = dict.employerDashboard as any;

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/funding`}>
      <Card className="bg-gradient-to-br from-primary/10 via-background/80 to-background border border-border/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.fundingSection.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.fundingSection.underlyingLabel}</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{String(ctx.underlyingAddr ?? "(loading)")}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.fundingSection.symbolLabel}</span>
              <span className="text-xs">{ctx.underlyingSymbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.fundingSection.decimalsLabel}</span>
              <span className="text-xs">{String(ctx.underlyingDecimalsValue ?? "(loading)")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.fundingSection.balanceLabel}</span>
              <Badge variant="default">
                {ctx.underlyingBalanceFormatted} {ctx.underlyingSymbol}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t.fundingSection.amountToWrapLabel} ({ctx.underlyingSymbol})
            </label>
            <Input
              value={ctx.wrapAmountInput}
              onChange={(e) => ctx.setWrapAmountInput(e.target.value)}
              placeholder="100"
              type="number"
              className="bg-background"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={ctx.onApproveWrap} variant="outline" size="sm">
              {t.fundingSection.approveButton}
            </Button>
            <Button onClick={ctx.onWrap} variant="default" size="sm">
              {t.fundingSection.wrapButton}
            </Button>
          </div>

          <div className="border-t border-border/20 mt-4" />

          <p className="text-xs text-muted-foreground">{t.fundingSection.flowNote}</p>
        </CardContent>
      </Card>
    </EmployerPageShell>
  );
}
