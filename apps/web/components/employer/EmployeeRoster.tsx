"use client";

import React from "react";
import type { Address } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployerRosterRow } from "@/lib/supabasePayroll";
import type { Dictionary } from "@/lib/useDictionary";

type ConfidentialT = {
  confidentialView: string;
  salaryPlaintext: string;
  historyDecryption: string;
  decryptionWarning: string;
};

type Props = {
  rows: EmployerRosterRow[];
  loading: boolean;
  onSelect: (addr: Address) => void;
  onRemove: (row: EmployerRosterRow) => void;
  t: Dictionary["employeeRoster"];
  // decrypt panel
  selectedEmployee: Address | "";
  onSelectEmployee: (addr: Address | string) => void;
  onDecryptSalary: () => Promise<void>;
  onDecryptLastPayment: () => Promise<void>;
  selectedSalaryPlain: bigint | null;
  selectedSalaryFormatted: string | null;
  selectedLastPaymentPlain: bigint | null;
  selectedLastPaymentFormatted: string | null;
  underlyingSymbol: string;
  tConfidential: ConfidentialT;
  // single payroll
  onRunPayroll?: (row: EmployerRosterRow) => void;
};

function cadenceLabel(c: string | undefined) {
  if (!c) return "—";
  if (c === "semiMonthly") return "semi-monthly";
  return c;
}

export function EmployeeRoster({
  rows,
  loading,
  onSelect,
  onRemove,
  t,
  selectedEmployee,
  onSelectEmployee,
  onDecryptSalary,
  onDecryptLastPayment,
  selectedSalaryPlain,
  selectedSalaryFormatted,
  selectedLastPaymentPlain,
  selectedLastPaymentFormatted,
  underlyingSymbol,
  tConfidential,
  onRunPayroll,
}: Props) {
  const activeCount = rows.filter((r) => r.active).length;

  function toggleDecrypt(addr: Address) {
    onSelectEmployee(selectedEmployee === addr ? "" : addr);
  }

  return (
    <Card className="col-span-2 bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.title}
          </CardTitle>
          <Badge variant="outline" className="bg-muted border-border text-muted-foreground text-[10px] px-2 py-0.5">
            {t.count}: {rows.length}
          </Badge>
        </div>
        {rows.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {rows.length} {t.total} — {activeCount} {t.active}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnWallet}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnJobTitle}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnSince}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnCadence ?? "Cadence"}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnNextDue ?? "Next due"}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnStatus}
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                {t.columnActions}
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground text-sm">
                  {t.loading}
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground text-sm">
                  {t.empty}
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => {
                const isExpanded = selectedEmployee === row.wallet_address;
                return (
                  <React.Fragment key={row.employment_chain_binding_id}>
                    <tr
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <code className="text-xs font-mono text-muted-foreground">
                          {row.wallet_address.slice(0, 10)}…{row.wallet_address.slice(-8)}
                        </code>
                      </td>

                      <td className="py-3 px-4 text-sm text-foreground">
                        {row.job_title ?? <span className="text-muted-foreground/40">{t.noTitle}</span>}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.start_date}</td>

                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {cadenceLabel(row.payroll_cadence)}
                      </td>

                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {row.next_pay_date ? (
                          <div className="space-y-0.5">
                            <div>{row.next_pay_date}</div>
                            <div className="text-[10px] text-muted-foreground/70 font-mono">
                              {row.next_period_code ?? "—"}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            row.active
                              ? "bg-success/10 text-success-foreground border-success/30 text-[10px]"
                              : "bg-muted text-muted-foreground border-border text-[10px]"
                          }
                        >
                          {row.active ? t.statusActive : t.statusInactive}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSelect(row.wallet_address)}
                            title={t.inspect}
                            className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            ✎
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleDecrypt(row.wallet_address)}
                            title={tConfidential.confidentialView}
                            className={`w-7 h-7 hover:bg-primary/10 transition-colors ${isExpanded ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                          </Button>

                          {row.active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Run payroll for this employee"
                              onClick={() => onRunPayroll?.(row)}
                              className="w-7 h-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </Button>
                          )}

                          {row.active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={t.remove}
                              onClick={() => {
                                if (confirm(t.removeConfirm)) onRemove(row);
                              }}
                              className="w-7 h-7 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/10"
                            >
                              🗑
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${row.employment_chain_binding_id}-decrypt`} className="bg-primary/5 border-b border-border/50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="flex gap-4">
                            {/* Salary plaintext */}
                            <div className="flex-1 bg-background rounded p-3 border border-border/30">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                {tConfidential.salaryPlaintext}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {[...Array(8)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                                  ))}
                                </div>
                                <Button
                                  onClick={onDecryptSalary}
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-primary hover:bg-primary/10"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                  </svg>
                                </Button>
                              </div>
                              {selectedSalaryPlain !== null && (
                                <p className="text-sm font-mono text-foreground mt-2">
                                  {selectedSalaryFormatted} {underlyingSymbol}
                                </p>
                              )}
                            </div>

                            {/* History decryption */}
                            <div className="flex-1 bg-background rounded p-3 border border-border/30">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                {tConfidential.historyDecryption}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {[...Array(8)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                                  ))}
                                </div>
                                <Button
                                  onClick={onDecryptLastPayment}
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-primary hover:bg-primary/10"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </Button>
                              </div>
                              {selectedLastPaymentPlain !== null && (
                                <p className="text-sm font-mono text-foreground mt-2">
                                  {selectedLastPaymentFormatted} {underlyingSymbol}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed whitespace-pre-line">
                            {tConfidential.decryptionWarning}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
