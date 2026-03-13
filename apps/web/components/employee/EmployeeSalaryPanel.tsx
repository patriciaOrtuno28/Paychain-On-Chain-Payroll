"use client";

import { formatUnits, type Address } from "viem";
import { useReadContract, useWalletClient } from "wagmi";
import { useState } from "react";
import type { Abi } from "viem";
import { handleToHex32, userDecryptUint64 } from "@/lib/fhe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/useDictionary";

type Props = {
  payrollAddr: Address;
  payrollAbi: Abi;
  me: Address;
  chainId: number;
  canUseFhe: boolean;
  tokenDecimals: number;
  tokenSymbol: string;
  t: Dictionary;
};

export function EmployeeSalaryPanel({
  payrollAddr,
  payrollAbi,
  me,
  chainId,
  canUseFhe,
  tokenDecimals,
  tokenSymbol,
  t,
}: Props) {
  const { data: walletClient } = useWalletClient();

  const [salaryPlain, setSalaryPlain] = useState<bigint | null>(null);
  const [lastPaymentPlain, setLastPaymentPlain] = useState<bigint | null>(null);
  const [status, setStatus] = useState("");

  const mySalaryHandle = useReadContract({
    address: payrollAddr,
    abi: payrollAbi,
    functionName: "mySalary",
    account: me,
  });

  const myLastPaymentHandle = useReadContract({
    address: payrollAddr,
    abi: payrollAbi,
    functionName: "myLastPayment",
    account: me,
  });

  const myLastRunId = useReadContract({
    address: payrollAddr,
    abi: payrollAbi,
    functionName: "myLastRunId",
    account: me,
  });

  async function decryptSalary() {
    if (!walletClient || !mySalaryHandle.data)
      throw new Error("Missing salary handle");
    if (!canUseFhe)
      throw new Error(t.employeeSalaryPanel.errorSwitchToSepolia);
    setStatus(t.employeeSalaryPanel.decryptingSalary);
    const v = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: payrollAddr,
      handle: handleToHex32(mySalaryHandle.data),
    });
    setSalaryPlain(v);
    setStatus(t.employeeSalaryPanel.salaryDecrypted);
  }

  async function decryptLastPayment() {
    if (!walletClient || !myLastPaymentHandle.data)
      throw new Error("Missing last payment handle");
    if (!canUseFhe)
      throw new Error(t.employeeSalaryPanel.errorSwitchToSepolia);
    setStatus(t.employeeSalaryPanel.decryptingLastPayment);
    const v = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: payrollAddr,
      handle: handleToHex32(myLastPaymentHandle.data),
    });
    setLastPaymentPlain(v);
    setStatus(t.employeeSalaryPanel.lastPaymentDecrypted);
  }

  function fmtErr(e: unknown) {
    return e instanceof Error ? e.message : String(e);
  }

  return (
    <>
      <Card className="bg-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.employeeSalaryPanel.salaryTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mySalaryHandle.error ? (
            <div className="text-destructive text-sm">
              {t.employeeSalaryPanel.errorCannotReadSalary}:{" "}
              {mySalaryHandle.error.message}
              <br />
              <small>{t.employeeSalaryPanel.errorNotEmployee}</small>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                <b>{t.employeeSalaryPanel.handle}</b>:{" "}
                {String(mySalaryHandle.data ?? t.employeeSalaryPanel.loading)}
              </div>
              <Button
                onClick={() =>
                  decryptSalary().catch((e) => setStatus(fmtErr(e)))
                }
                disabled={!mySalaryHandle.data}
                variant="outline"
                size="sm"
              >
                {t.employeeSalaryPanel.decryptSalary}
              </Button>
              {salaryPlain !== null && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    {formatUnits(salaryPlain, tokenDecimals)} {tokenSymbol}
                  </Badge>
                  <small className="text-muted-foreground">
                    ({t.employeeSalaryPanel.raw}: {salaryPlain.toString()})
                  </small>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t.employeeSalaryPanel.lastPaymentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myLastPaymentHandle.error ? (
            <div className="text-destructive text-sm">
              {t.employeeSalaryPanel.errorCannotReadLastPayment}:{" "}
              {myLastPaymentHandle.error.message}
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                <b>{t.employeeSalaryPanel.handle}</b>:{" "}
                {String(
                  myLastPaymentHandle.data ?? t.employeeSalaryPanel.loading
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <b>{t.employeeSalaryPanel.lastRunId}</b>:{" "}
                {String(myLastRunId.data ?? t.employeeSalaryPanel.none)}
              </div>
              <Button
                onClick={() =>
                  decryptLastPayment().catch((e) => setStatus(fmtErr(e)))
                }
                disabled={!myLastPaymentHandle.data}
                variant="outline"
                size="sm"
              >
                {t.employeeSalaryPanel.decryptLastPayment}
              </Button>
              {lastPaymentPlain !== null && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    {formatUnits(lastPaymentPlain, tokenDecimals)} {tokenSymbol}
                  </Badge>
                  <small className="text-muted-foreground">
                    ({t.employeeSalaryPanel.raw}: {lastPaymentPlain.toString()})
                  </small>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {status && (
        <div
          className={`text-sm ${
            status.startsWith("✅")
              ? "text-green-600"
              : status.startsWith("❌")
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {status}
        </div>
      )}
    </>
  );
}
