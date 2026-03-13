"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeRoster } from "@/components/employer/EmployeeRoster";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { SingleEmployeePayrollModal } from "@/components/employer/SingleEmployeePayrollModal";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";
import type { EmployerRosterRow } from "@/lib/supabasePayroll";

export default function EmployerRosterPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  const router = useRouter();

  const [payrollModalEmployee, setPayrollModalEmployee] = useState<EmployerRosterRow | null>(null);

  if (!dict) return null;

  function handleRunPayroll(row: EmployerRosterRow) {
    ctx.onSelectEmployee(row.wallet_address);
    setPayrollModalEmployee(row);
  }

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/roster`}>
      <EmployeeRoster
        rows={ctx.rosterRows}
        loading={ctx.rosterLoading}
        onSelect={(addr) => ctx.onSelectEmployee(addr)}
        onRemove={ctx.onRemoveEmployee}
        t={dict.employeeRoster}
        selectedEmployee={ctx.selectedEmployee}
        onSelectEmployee={(addr) => ctx.onSelectEmployee(addr as any)}
        onDecryptSalary={ctx.onDecryptSalary}
        onDecryptLastPayment={ctx.onDecryptLastPayment}
        selectedSalaryPlain={ctx.selectedSalaryPlain}
        selectedSalaryFormatted={ctx.selectedSalaryFormatted}
        selectedLastPaymentPlain={ctx.selectedLastPaymentPlain}
        selectedLastPaymentFormatted={ctx.selectedLastPaymentFormatted}
        underlyingSymbol={ctx.underlyingSymbol}
        tConfidential={{
          confidentialView: (dict.employerDashboard as any).confidentialView,
          salaryPlaintext: (dict.employerDashboard as any).salaryPlaintext,
          historyDecryption: (dict.employerDashboard as any).historyDecryption,
          decryptionWarning: (dict.employerDashboard as any).decryptionWarning,
        }}
        onRunPayroll={handleRunPayroll}
      />

      <SingleEmployeePayrollModal
        open={payrollModalEmployee !== null}
        onOpenChange={(open) => { if (!open) setPayrollModalEmployee(null); }}
        employee={payrollModalEmployee}
        payrollAddr={ctx.payrollAddr}
        operatorStatus={ctx.operatorStatus}
        operatorDays={ctx.operatorDays}
        computedRunId={ctx.computedEmployeeRunId}
        computedPeriod={ctx.computedEmployeePayrollPeriod}
        salaryHandle={ctx.selectedSalaryHandle}
        onRunSingle={ctx.onRunPayrollSingle}
        onGoToOperator={() => router.push(`/${ctx.locale}/employer/operator`)}
      />
    </EmployerPageShell>
  );
}
