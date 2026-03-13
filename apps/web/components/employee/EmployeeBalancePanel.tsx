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
  wrapperAddr: Address;
  wrapperAbi: Abi;
  me: Address;
  chainId: number;
  canUseFhe: boolean;
  tokenDecimals: number;
  tokenSymbol: string;
  t: Dictionary;
};

export function EmployeeBalancePanel({
  wrapperAddr,
  wrapperAbi,
  me,
  chainId,
  canUseFhe,
  tokenDecimals,
  tokenSymbol,
  t,
}: Props) {
  const { data: walletClient } = useWalletClient();
  const [balancePlain, setBalancePlain] = useState<bigint | null>(null);
  const [status, setStatus] = useState("");

  const myTokenBalHandle = useReadContract({
    address: wrapperAddr,
    abi: wrapperAbi,
    functionName: "confidentialBalanceOf",
    args: [me],
  });

  async function decryptBalance() {
    if (!walletClient || !myTokenBalHandle.data)
      throw new Error(t.employeeBalancePanel.errorMissingHandle);
    if (!canUseFhe)
      throw new Error(t.employeeBalancePanel.errorSwitchToSepolia);
    setStatus(t.employeeBalancePanel.decrypting);
    const v = await userDecryptUint64({
      chainId,
      walletClient,
      contractAddress: wrapperAddr,
      handle: handleToHex32(myTokenBalHandle.data),
    });
    setBalancePlain(v);
    setStatus(t.employeeBalancePanel.decrypted);
  }

  return (
    <Card className="bg-card border-primary/30">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {t.employeeBalancePanel.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground">
          <b>{t.employeeBalancePanel.handle}</b>:{" "}
          {String(myTokenBalHandle.data ?? t.employeeBalancePanel.loading)}
        </div>

        <Button
          onClick={() =>
            decryptBalance().catch((e) =>
              setStatus(e instanceof Error ? e.message : String(e))
            )
          }
          disabled={!myTokenBalHandle.data}
          variant="outline"
          size="sm"
        >
          {t.employeeBalancePanel.decryptButton}
        </Button>

        {balancePlain !== null && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm">
              {formatUnits(balancePlain, tokenDecimals)} {tokenSymbol}
            </Badge>
            <small className="text-muted-foreground">
              ({t.employeeBalancePanel.raw}: {balancePlain.toString()})
            </small>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t.employeeBalancePanel.note}
        </p>

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
      </CardContent>
    </Card>
  );
}
