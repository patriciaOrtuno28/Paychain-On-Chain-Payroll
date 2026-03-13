"use client";

import { useEffect, useState, use } from "react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import { EmployeeSettings } from "@/components/employee/EmployeeSettings";
import { useDictionary } from "@/lib/useDictionary";
import type { Locale } from "@/i18n-config";

export default function EmployeeSettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const lang = use(params).lang;
  const t = useDictionary(lang);

  const [status, setStatus] = useState("");

  if (!t) return null;

  return (
    <EmployeeSettings
      locale={lang as Locale}
      // Network state
      chainId={chainId}
      canUseFhe={chainId === sepolia.id}
      tokenSymbol="USDC"
      tokenDecimals={18}
      underlyingAddr={undefined}

      // Status
      status={status}
    />
  );
}
