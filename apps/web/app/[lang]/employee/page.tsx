'use client'
import { useEffect, useState, use } from "react";
import { type Address, formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRouter } from "next/navigation";

import { getContracts } from "@/lib/contracts";
import { getEmployeePayrollBindings, type EmployeePayrollBinding } from "@/lib/supabasePayroll";
import { handleToHex32, userDecryptUint64 } from "@/lib/fhe";

import { EmployeeSalary } from "@/components/employee/EmployeeSalary";
import { useDictionary } from "@/lib/useDictionary";
import type { Locale } from "@/i18n-config";

const erc20Abi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export default function EmployeePage({ params }: { params: Promise<{ lang: string }> }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const lang = use(params).lang;
  const t = useDictionary(lang);

  const [selectedPayroll, setSelectedPayroll] = useState<Address | "">("");
  const [bindings, setBindings] = useState<EmployeePayrollBinding[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [bindingsError, setBindingsError] = useState<string | null>(null);

  const [salaryPlain, setSalaryPlain] = useState<bigint | null>(null);
  const [salaryFormatted, setSalaryFormatted] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const me = address as Address | undefined;

  // Redirect to salary page
  useEffect(() => {
    if (lang) {
      router.replace(`/${lang}/employee/salary`);
    }
  }, [lang, router]);

  // Load employee payroll bindings
  useEffect(() => {
    if (!me || !chainId) return;
    setBindingsLoading(true);
    setBindingsError(null);
    getEmployeePayrollBindings({ employeeWalletAddress: me, chainId })
      .then((data) => {
        setBindings(data);
        // Auto-select first binding if only one exists
        if (data.length === 1) {
          setSelectedPayroll(data[0].payroll_contract_address);
        }
      })
      .catch((err) => {
        console.error("Failed to load bindings:", err);
        setBindingsError(err instanceof Error ? err.message : "Failed to load payroll bindings");
      })
      .finally(() => {
        setBindingsLoading(false);
      });
  }, [me, chainId]);

  // Read token info
  const { data: tokenSymbol } = useReadContract({
    address: selectedPayroll ? getContracts(sepolia.id).PayrollFactoryRegistry.address : undefined,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: sepolia.id,
  });

  const { data: tokenDecimals } = useReadContract({
    address: selectedPayroll ? getContracts(sepolia.id).PayrollFactoryRegistry.address : undefined,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: sepolia.id,
  });

  // Read salary handle
  const { data: salaryHandle } = useReadContract({
    address: selectedPayroll as `0x${string}` | undefined,
    abi: [
      {
        type: "function",
        name: "getEmployeeSalary",
        stateMutability: "view",
        inputs: [{ name: "employee", type: "address" }],
        outputs: [{ name: "", type: "bytes32" }],
      },
    ],
    functionName: "getEmployeeSalary",
    args: me ? [me] : undefined,
    chainId: sepolia.id,
  });

  // Decrypt salary
  const onDecryptSalary = async () => {
    if (!salaryHandle || !walletClient || !me || !selectedPayroll) return;
    try {
      setStatus("🔐 Decrypting salary...");
      const result = await userDecryptUint64({
        chainId: sepolia.id,
        walletClient,
        contractAddress: selectedPayroll,
        handle: salaryHandle
      });
      setSalaryPlain(result);
      const formatted = formatUnits(result, tokenDecimals ?? 18);
      setSalaryFormatted(formatted);
      setStatus("✅ Salary decrypted successfully!");
    } catch (err) {
      console.error("Failed to decrypt salary:", err);
      setStatus(`❌ Failed to decrypt salary: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const onSelectPayroll = (addr: Address) => {
    setSelectedPayroll(addr);
    setSalaryPlain(null);
    setSalaryFormatted(null);
  };

  if (!t) return null;

  return (
    <EmployeeSalary
      locale={lang as Locale}
      // Network state
      chainId={chainId}
      canUseFhe={chainId === sepolia.id}
      tokenSymbol={tokenSymbol ?? "USDC"}
      tokenDecimals={tokenDecimals ?? 18}
      underlyingAddr={getContracts(sepolia.id).PayrollFactoryRegistry.address}

      // Company selection
      bindings={bindings}
      bindingsLoading={bindingsLoading}
      bindingsError={bindingsError}
      selectedPayroll={selectedPayroll}
      onSelectPayroll={onSelectPayroll}

      // Salary
      salaryHandle={salaryHandle}
      salaryPlain={salaryPlain}
      salaryFormatted={salaryFormatted}
      onDecryptSalary={onDecryptSalary}

      // Status
      status={status}
    />
  );
}
