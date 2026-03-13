"use client";

import { useEffect, useState, use } from "react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import { EmployeeHelp } from "@/components/employee/EmployeeHelp";
import { useDictionary } from "@/lib/useDictionary";
import type { Locale } from "@/i18n-config";

export default function EmployeeHelpPage({ params }: { params: Promise<{ lang: string }> }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const lang = use(params).lang as Locale;
  const t = useDictionary(lang);

  const [status, setStatus] = useState("");

  if (!t) return null;

  return (
    <EmployeeHelp
      locale={lang as Locale}
      // Status
      status={status}
    />
  );
}
