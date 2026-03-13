"use client";

import { useEffect, useMemo, useState } from "react";
import { type Address } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function nowUtcDatetimeLocal(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function PayrollConfirmModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  payrollAddr: Address;

  operatorStatus?: boolean;
  operatorDays: string;

  activeEmployeeCount: number;
  activeCadenceCount: number;

  selectedEmployee: Address | "";

  onRunBatch: (referenceDateUtc: string) => Promise<void>;
  onRunSingle: () => Promise<void>;

  onScrollToOperator?: () => void;
}) {
  const {
    open,
    onOpenChange,
    payrollAddr,
    operatorStatus,
    operatorDays,
    activeEmployeeCount,
    activeCadenceCount,
    selectedEmployee,
    onRunBatch,
    onRunSingle,
    onScrollToOperator,
  } = props;

  const [referenceUtc, setReferenceUtc] = useState(nowUtcDatetimeLocal());
  const [ackImmediate, setAckImmediate] = useState(false);
  const [ackOperator, setAckOperator] = useState(false);
  const [busy, setBusy] = useState<"batch" | "single" | null>(null);

  useEffect(() => {
    if (open) {
      setReferenceUtc(nowUtcDatetimeLocal());
      setAckImmediate(false);
      setAckOperator(false);
      setBusy(null);
    }
  }, [open]);

  const operatorOk = operatorStatus !== false;

  const canRun = useMemo(() => {
    // Require explicit acknowledgement + operatorOk to avoid guaranteed revert.
    return ackImmediate && ackOperator && operatorOk && busy === null;
  }, [ackImmediate, ackOperator, operatorOk, busy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-background border border-border shadow-xl rounded-lg overflow-hidden">
          <div className="p-5 border-b border-border flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Run payroll</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This will submit an on-chain transaction. It does not schedule or “wait” — it runs when mined.
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8">
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {/* Operator requirement */}
            <div className={`rounded border p-4 ${operatorOk ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Operator approval is {operatorOk ? "enabled" : "missing"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The Payroll contract must be approved as an <b>operator</b> so it can transfer confidential tokens
                    from your wallet to employees. Without this, the contract will revert with <code>PayrollNotOperator</code>.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {operatorOk ? "OK" : "ACTION REQUIRED"}
                </Badge>
              </div>

              <div className="mt-3 text-xs text-muted-foreground space-y-2">
                <p>
                  <b>Why is this necessary?</b> The contract pays employees by calling{" "}
                  <code>confidentialTransferFrom(employer, employee, encryptedSalary)</code>. That requires an operator
                  permission, similar to an allowance — but for confidential balances.
                </p>
                <p>
                  <b>Is it safe?</b> This approval is limited in three important ways:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    The contract can only transfer the encrypted salary amount you set on-chain (it cannot invent a salary).
                  </li>
                  <li>
                    Each payroll run uses a <b>runId</b> duplicate lock: the same employee cannot be paid twice for the same runId.
                  </li>
                  <li>
                    You set an expiry in days (you currently have <b>{operatorDays}</b> days selected). You can renew periodically.
                  </li>
                </ul>

                {!operatorOk && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        onOpenChange(false);
                        onScrollToOperator?.();
                      }}
                    >
                      Go set operator approval
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">
                      (Scrolls you to the Operator Controls card)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* What will be paid */}
            <div className="rounded border border-border p-4 bg-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">What this will do</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Active employees: {activeEmployeeCount}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Cadence groups: {activeCadenceCount}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Batch payroll groups employees by their cadence (weekly/monthly/etc). Because the contract’s batch function accepts
                only one runId, mixed cadences can require <b>multiple transactions</b> (one per cadence group).
              </p>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Reference time (UTC)
                </label>
                <Input
                  type="datetime-local"
                  value={referenceUtc}
                  onChange={(e) => setReferenceUtc(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We compute each cadence’s current “period bucket” from this UTC timestamp to derive runIds. Running again in the same
                  bucket is blocked by the contract (duplicate protection).
                </p>
              </div>
            </div>

            {/* Acknowledgements */}
            <div className="rounded border border-border p-4 bg-card space-y-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ackImmediate}
                  onChange={(e) => setAckImmediate(e.target.checked)}
                />
                <span>
                  I understand this executes immediately once the transaction is mined (it does not wait for a due date).
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ackOperator}
                  onChange={(e) => setAckOperator(e.target.checked)}
                />
                <span>
                  I confirm the payroll contract <code>{payrollAddr.slice(0, 10)}…</code> is approved as an operator for my confidential balance.
                </span>
              </label>

              {!operatorOk && (
                <p className="text-xs text-destructive-foreground">
                  Operator approval is missing — running payroll would revert. Set operator approval first.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Single vs batch: single pays only the selected employee; batch pays all active employees (grouped by cadence).
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!selectedEmployee || !canRun}
                onClick={async () => {
                  try {
                    setBusy("single");
                    await onRunSingle();
                    onOpenChange(false);
                  } finally {
                    setBusy(null);
                  }
                }}
                title={!selectedEmployee ? "Select an employee to enable single payroll" : ""}
              >
                {busy === "single" ? "Submitting…" : "Run payroll (single)"}
              </Button>

              <Button
                variant="default"
                disabled={!canRun || activeEmployeeCount === 0}
                onClick={async () => {
                  try {
                    setBusy("batch");
                    await onRunBatch(referenceUtc);
                    onOpenChange(false);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "batch" ? "Submitting…" : "Run payroll (batch)"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}