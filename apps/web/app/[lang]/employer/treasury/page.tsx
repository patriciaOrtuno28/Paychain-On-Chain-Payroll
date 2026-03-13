"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

export default function EmployerTreasuryPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict) return null;
  const t = dict.employerDashboard as any;

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/treasury`}>
      <Card className="bg-gradient-to-br from-primary/10 via-background/80 to-background border border-border/30 shadow-sm">
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
                onClick={ctx.onDecryptBalance}
                variant="outline"
                className="bg-transparent border-primary text-primary hover:bg-primary/10 h-8 px-3 text-xs"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                {t.decrypt}
              </Button>
            </div>

            {ctx.employerConfidentialBalanceFormatted !== null && (
              <p className="text-lg font-mono text-foreground mt-3">
                {ctx.employerConfidentialBalanceFormatted} {ctx.underlyingSymbol}
              </p>
            )}
          </div>
          <div className="border-t border-border/20 mt-4" />
          <p className="text-xs text-muted-foreground leading-relaxed">{t.decryptionNote}</p>
        </CardContent>
      </Card>
    </EmployerPageShell>
  );
}
