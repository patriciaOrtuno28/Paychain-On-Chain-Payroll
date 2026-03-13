"use client";

import { RegisterEmployeeForm } from "@/components/employer/RegisterEmployeeForm";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

export default function EmployerRegisterPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict || !ctx.payrollAbi) return null;

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/register`}>
      <RegisterEmployeeForm
        payrollAddr={ctx.payrollAddr}
        payrollAbi={ctx.payrollAbi}
        companyOnchainBindingId={ctx.companyOnchainBindingId ?? ""}
        underlyingDecimals={ctx.underlyingDecimalsValue}
        underlyingSymbol={ctx.underlyingSymbol}
        onSuccess={ctx.onSuccess}
        t={dict.registerEmployeeForm}
      />
    </EmployerPageShell>
  );
}
