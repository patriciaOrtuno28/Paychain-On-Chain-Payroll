"use client";

import { useAccount, useChainId } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteCompanyButton } from "@/components/employer/DeleteCompanyButton";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

function AddressRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0 pt-0.5">{label}</span>
      <code className="text-xs font-mono text-foreground break-all text-right">{value}</code>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value?: string; badge?: { text: string; ok: boolean } }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs font-mono text-foreground">{value}</span>}
        {badge && (
          <Badge
            variant="outline"
            className={
              badge.ok
                ? "bg-success/10 text-success-foreground border-success/30 text-[10px]"
                : "bg-destructive/10 text-destructive-foreground border-destructive/30 text-[10px]"
            }
          >
            {badge.text}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function EmployerSettingsPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  const { address: me } = useAccount();
  const chainId = useChainId();
  if (!dict) return null;

  const CHAIN_NAMES: Record<number, string> = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
  };

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/settings`}>
      {/* Company info */}
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Company
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow label="Legal name" value={ctx.companyName} />
          <InfoRow
            label="Backend sync"
            badge={{ text: ctx.backendSynced ? "Synced" : "Not synced", ok: ctx.backendSynced }}
          />
          {ctx.companyOnchainBindingId && (
            <AddressRow label="On-chain binding ID" value={ctx.companyOnchainBindingId} />
          )}
        </CardContent>
      </Card>

      {/* Connected wallet & chain */}
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Wallet & Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <AddressRow label="Employer wallet" value={me} />
          <InfoRow
            label="Chain"
            value={`${CHAIN_NAMES[chainId] ?? "Unknown"} (${chainId})`}
          />
          <InfoRow
            label="FHE available"
            badge={{ text: ctx.canUseFhe ? "Yes" : "No — switch to Sepolia", ok: ctx.canUseFhe }}
          />
        </CardContent>
      </Card>

      {/* Contract addresses */}
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Contract Addresses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <AddressRow label="Payroll contract" value={ctx.payrollAddr !== "0x0000000000000000000000000000000000000000" ? ctx.payrollAddr : undefined} />
          <AddressRow label="Registry" value={ctx.registryAddress} />
          <AddressRow label="Confidential wrapper" value={ctx.wrapperAddress} />
          <AddressRow label="Underlying token" value={ctx.underlyingAddr} />
          {!ctx.hasCompany && (
            <p className="text-xs text-muted-foreground pt-2">No payroll contract deployed yet for this wallet.</p>
          )}
        </CardContent>
      </Card>

      {/* Token info */}
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Token Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow label="Symbol" value={ctx.underlyingSymbol} />
          <InfoRow label="Wrapper rate" value={ctx.wrapperRate !== "(loading)" ? `1 ${ctx.underlyingSymbol} = ${ctx.wrapperRate} w${ctx.underlyingSymbol}` : ctx.wrapperRate} />
        </CardContent>
      </Card>

      {/* Danger zone */}
      {ctx.hasCompany && (
        <DeleteCompanyButton companyName={ctx.companyName} onDeleteCompany={ctx.onDeleteCompany} />
      )}
    </EmployerPageShell>
  );
}
