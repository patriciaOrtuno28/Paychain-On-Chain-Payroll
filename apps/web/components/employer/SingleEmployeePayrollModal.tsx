"use client";

import { useEffect, useState } from "react";
import { type Address } from "viem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EmployerRosterRow } from "@/lib/supabasePayroll";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployerRosterRow | null;
  payrollAddr: Address;
  operatorStatus?: boolean;
  operatorDays: string;
  computedRunId: string | null;
  computedPeriod: { humanLabel: string; id: bigint };
  salaryHandle: string;
  onRunSingle: () => Promise<void>;
  onGoToOperator: () => void;
};

type ContractCheck = {
  label: string;
  ok: boolean;
  detail: string;
};

export function SingleEmployeePayrollModal({
  open,
  onOpenChange,
  employee,
  payrollAddr,
  operatorStatus,
  operatorDays,
  computedRunId,
  computedPeriod,
  salaryHandle,
  onRunSingle,
  onGoToOperator,
}: Props) {
  const [ackImmediate, setAckImmediate] = useState(false);
  const [ackOperator, setAckOperator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAckImmediate(false);
      setAckOperator(false);
      setBusy(false);
      setTxError(null);
    }
  }, [open]);

  function parseContractError(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("AlreadyPaidForRun"))
      return "This employee has already been paid for the current period (runId). You cannot pay the same employee twice in the same payroll run. Wait for the next period to run payroll again.";
    if (msg.includes("PayrollNotOperator"))
      return "The payroll contract is not approved as an operator. Go to Operator Controls and grant approval before running payroll.";
    if (msg.includes("SalaryNotSet"))
      return "No encrypted salary is set for this employee. Use Edit Employee to set a salary first.";
    if (msg.includes("NotEmployee"))
      return "This address is not registered as an active employee in the payroll contract.";
    if (msg.includes("CompanyDeactivated"))
      return "This payroll contract has been deactivated and can no longer process payments.";
    if (msg.includes("InvalidRunId"))
      return "The computed runId is invalid. This may indicate the company reference has not loaded yet — try again in a moment.";
    if (msg.includes("User rejected") || msg.includes("user rejected"))
      return "Transaction was rejected in your wallet.";
    // Trim long viem messages to the first meaningful line
    const firstLine = msg.split("\n")[0];
    return firstLine.length > 200 ? firstLine.slice(0, 200) + "…" : firstLine;
  }

  if (!open || !employee) return null;

  const operatorOk = operatorStatus !== false;
  const salarySet = salaryHandle !== "(none)" && salaryHandle !== "";
  const employeeActive = employee.active;

  const checks: ContractCheck[] = [
    {
      label: "Employee active",
      ok: employeeActive,
      detail: employeeActive
        ? "This employee is registered and active in the payroll contract."
        : "Employee is inactive. Re-activate them before running payroll.",
    },
    {
      label: "Salary set",
      ok: salarySet,
      detail: salarySet
        ? `Encrypted salary handle: ${salaryHandle.slice(0, 18)}…`
        : "No encrypted salary found. Use Edit Employee to set a salary first.",
    },
    {
      label: "Operator approval",
      ok: operatorOk,
      detail: operatorOk
        ? `The payroll contract is approved as an operator and can call confidentialTransferFrom() on your behalf.`
        : `The payroll contract is NOT approved as an operator. The transaction will revert with PayrollNotOperator. Grant approval in Operator Controls (${operatorDays} days selected).`,
    },
    {
      label: "RunId (duplicate lock)",
      ok: !!computedRunId,
      detail: computedRunId
        ? `runId = ${computedRunId.slice(0, 18)}… — period: ${computedPeriod.humanLabel}. The contract will reject a second payment for this runId.`
        : "RunId could not be computed (companyRef not loaded yet).",
    },
  ];

  const allChecksPass = checks.every((c) => c.ok);
  const canRun = ackImmediate && ackOperator && allChecksPass && !busy;

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
        <div className="w-full max-w-xl bg-background border border-border shadow-xl rounded-lg overflow-hidden">

          {/* Header */}
          <div className="p-5 border-b border-border flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Run payroll for employee</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This submits an on-chain transaction that executes immediately when mined.
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 shrink-0">
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Employee summary */}
            <div className="rounded border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-foreground">
                  {employee.wallet_address}
                </code>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {employee.job_title ?? "No title"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Cadence: <span className="text-foreground">{employee.payroll_cadence ?? "—"}</span></span>
                <span>Period: <span className="text-foreground font-mono">{computedPeriod.humanLabel}</span></span>
              </div>
            </div>

            {/* Contract requirement checks */}
            <div className="rounded border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contract requirements</p>
              {checks.map((check) => (
                <div key={check.label} className={`rounded p-3 ${check.ok ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{check.label}</span>
                    <Badge
                      variant="outline"
                      className={check.ok
                        ? "bg-success/10 text-success-foreground border-success/30 text-[10px]"
                        : "bg-destructive/10 text-destructive-foreground border-destructive/30 text-[10px]"
                      }
                    >
                      {check.ok ? "OK" : "FAIL"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{check.detail}</p>
                  {check.label === "Operator approval" && !check.ok && (
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        onOpenChange(false);
                        onGoToOperator();
                      }}
                    >
                      Go to Operator Controls
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* What will happen */}
            <div className="rounded border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What this will do</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calls <code>runPayrollForRun(employee, runId)</code> on the payroll contract{" "}
                <code className="text-[10px]">{payrollAddr.slice(0, 10)}…</code>.
                The contract will execute <code>confidentialTransferFrom(employer, employee, encryptedSalary)</code> —
                moving the encrypted salary from your confidential balance directly to the employee's wallet.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The salary amount is never revealed on-chain. The runId{" "}
                <code className="text-[10px]">{computedRunId ? computedRunId.slice(0, 18) + "…" : "(loading)"}</code>{" "}
                prevents double payment: the contract will reject any second call for this employee in the same period.
              </p>
            </div>

            {/* Acknowledgements */}
            <div className="rounded border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm before running</p>
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ackImmediate}
                  onChange={(e) => setAckImmediate(e.target.checked)}
                />
                <span>
                  I understand this executes immediately once the transaction is mined and cannot be cancelled after submission.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={ackOperator}
                  onChange={(e) => setAckOperator(e.target.checked)}
                />
                <span>
                  I confirm the payroll contract <code>{payrollAddr.slice(0, 10)}…</code> is approved as an operator
                  and is authorized to transfer encrypted tokens from my confidential balance.
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border space-y-3">
            {txError && (
              <div className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-xs font-semibold text-destructive-foreground mb-1">Transaction failed</p>
                <p className="text-xs text-destructive-foreground leading-relaxed">{txError}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {!allChecksPass
                  ? "Resolve the failing checks above before running payroll."
                  : !ackImmediate || !ackOperator
                  ? "Check both boxes to confirm."
                  : "Ready to submit."}
              </div>
              <Button
                disabled={!canRun}
                onClick={async () => {
                  setTxError(null);
                  try {
                    setBusy(true);
                    await onRunSingle();
                    onOpenChange(false);
                  } catch (e) {
                    setTxError(parseContractError(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy ? "Submitting…" : "Run payroll for this employee"}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
