"use client";

import type { Address } from "viem";
import type { EmployeePayrollBinding } from "@/lib/supabasePayroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/useDictionary";

type Props = {
  bindings: EmployeePayrollBinding[];
  loading: boolean;
  error: string | null;
  selectedPayroll: Address | "";
  onSelect: (addr: Address | "") => void;
  t: Dictionary;
};

export function EmployeeCompanySelector({
  bindings,
  loading,
  error,
  selectedPayroll,
  onSelect,
  t,
}: Props) {
  const selectedBinding = bindings.find(
    (b) => b.payroll_contract_address === selectedPayroll
  );

  return (
    <Card className="bg-card border-primary/30">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {t.employeeCompanySelector.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">
            {t.employeeCompanySelector.loading}
          </div>
        )}

        {!loading && error && (
          <div className="text-destructive text-sm">
            {t.employeeCompanySelector.errorPrefix}: {error}
          </div>
        )}

        {!loading && !error && bindings.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {t.employeeCompanySelector.noAssociation}
            <br />
            <small>{t.employeeCompanySelector.noAssociationHint}</small>
          </div>
        )}

        {!loading && !error && bindings.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              {t.employeeCompanySelector.foundContracts}:{" "}
              <b>{bindings.length}</b>
            </div>

            {bindings.length === 1 ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t.employeeCompanySelector.company}
                  </span>
                  <Badge variant="default">{bindings[0].company_name}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t.employeeCompanySelector.payrollContract}
                  </span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {bindings[0].payroll_contract_address}
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {t.employeeCompanySelector.selectCompany}
                </label>
                <select
                  value={selectedPayroll}
                  onChange={(e) => onSelect(e.target.value as Address)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    {t.employeeCompanySelector.selectPlaceholder}
                  </option>
                  {bindings.map((b) => (
                    <option
                      key={b.payroll_contract_address}
                      value={b.payroll_contract_address}
                    >
                      {b.company_name} — {b.payroll_contract_address.slice(0, 10)}
                      …
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBinding && (
              <div className="bg-muted rounded-md p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t.employeeCompanySelector.company}
                  </span>
                  <Badge variant="secondary">
                    {selectedBinding.company_name}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t.employeeCompanySelector.payrollContract}
                  </span>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {selectedBinding.payroll_contract_address}
                  </code>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
