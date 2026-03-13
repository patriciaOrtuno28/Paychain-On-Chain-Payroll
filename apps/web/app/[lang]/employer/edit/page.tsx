"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditEmployeePanel } from "@/components/employer/EditEmployeePanel";
import { EmployerPageShell } from "@/components/employer/EmployerPageShell";
import { useEmployerContext } from "@/app/[lang]/employer/EmployerContext";
import { useDictionary } from "@/lib/useDictionary";

export default function EmployerEditPage() {
  const ctx = useEmployerContext();
  const dict = useDictionary(ctx.locale);
  if (!dict) return null;

  const selectedRow = ctx.selectedRow;
  const dashboardDict = dict.employerDashboard as any;

  return (
    <EmployerPageShell currentPath={`/${ctx.locale}/employer/edit`}>
      {selectedRow ? (
        <EditEmployeePanel
          row={selectedRow}
          onSaveOffchain={(updates) => ctx.onUpdateEmployeeOffchain(selectedRow, updates)}
          underlyingSymbol={ctx.underlyingSymbol}
          updateSalaryInput={ctx.updateSalaryInput}
          setUpdateSalaryInput={ctx.setUpdateSalaryInput}
          onUpdateSalary={ctx.onUpdateSalary}
          computedPayrollPeriod={ctx.computedEmployeePayrollPeriod}
          computedRunId={ctx.computedEmployeeRunId}
          onRunPayrollSingle={ctx.onRunPayrollSingle}
          t={dict.editEmployeePanel}
        />
      ) : (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              {dashboardDict.editEmployeeTitle ?? "Edit employee"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-foreground">
              {dashboardDict.editEmployeeEmptyState ?? "Select an employee from the roster to edit off-chain fields and update salary."}
            </p>
            <p className="text-xs text-muted-foreground">
              {dashboardDict.editEmployeeEmptyStateHint ?? "Tip: clicking a row in the roster will select it."}
            </p>
          </CardContent>
        </Card>
      )}
    </EmployerPageShell>
  );
}
