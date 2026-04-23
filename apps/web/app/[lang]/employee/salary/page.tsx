"use client";

import { useEffect, useState, use } from "react";
import { type Address, formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";

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

export default function EmployeeSalaryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { address, status: accountStatus, connector } = useAccount();
  const chainId = useChainId();
  const {
    data: walletClient,
    error: walletClientError,
    status: walletClientStatus,
    fetchStatus: walletClientFetchStatus,
    refetch: refetchWalletClient,
  } = useWalletClient();
  const lang = use(params).lang as Locale;
  const t = useDictionary(lang);

  const [selectedPayroll, setSelectedPayroll] = useState<Address | "">("");
  const [bindings, setBindings] = useState<EmployeePayrollBinding[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [bindingsError, setBindingsError] = useState<string | null>(null);

  const [salaryPlain, setSalaryPlain] = useState<bigint | null>(null);
  const [salaryFormatted, setSalaryFormatted] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const me = address as Address | undefined;

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
    address: selectedPayroll ? getContracts(sepolia.id).PayrollConfidentialWrapper.address : undefined,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: sepolia.id,
  });

  const { data: tokenDecimals } = useReadContract({
    address: selectedPayroll ? getContracts(sepolia.id).PayrollConfidentialWrapper.address : undefined,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: sepolia.id,
  });

  // Read salary handle — mySalary() is a self-call; account: me makes the RPC simulate as the employee
  const { data: salaryHandle } = useReadContract({
    address: (selectedPayroll || undefined) as Address | undefined,
    abi: getContracts(sepolia.id).PayrollAbi,
    functionName: "mySalary",
    account: me,
    chainId: sepolia.id,
    query: { enabled: !!selectedPayroll && !!me },
  });

  // Decrypt salary
  const onDecryptSalary = async () => {
    console.info("[EmployeeSalaryPage] decrypt click", {
      me,
      selectedPayroll,
      hasSalaryHandle: !!salaryHandle,
      chainId,
      canUseFhe: chainId === sepolia.id,
      accountStatus,
      connectorId: connector?.id,
      connectorName: connector?.name,
      walletClientStatus,
      walletClientFetchStatus,
      walletClientError: walletClientError?.message,
    });
    if (!selectedPayroll) {
      setStatus("❌ No payroll selected.");
      return;
    }
    if (!me) {
      setStatus("❌ Wallet not connected.");
      return;
    }
    let activeWalletClient = walletClient;
    if (!activeWalletClient && (walletClientStatus === "pending" || walletClientFetchStatus === "fetching")) {
      setStatus("⏳ Waiting for wallet signer...");
      const refreshed = await refetchWalletClient();
      activeWalletClient = refreshed.data;
      console.info("[EmployeeSalaryPage] wallet client refetch", {
        afterStatus: refreshed.status,
        hasWalletClient: !!refreshed.data,
        error: refreshed.error?.message,
      });
    }
    if (!activeWalletClient) {
      console.error("[EmployeeSalaryPage] wallet client unavailable", {
        accountStatus,
        connectorId: connector?.id,
        connectorName: connector?.name,
        walletClientStatus,
        walletClientFetchStatus,
        walletClientError,
      });
      setStatus(
        `❌ Wallet client not ready. account=${accountStatus}, connector=${connector?.name ?? "none"}, walletClient=${walletClientStatus}${
          walletClientError?.message ? `, error=${walletClientError.message}` : ""
        }`
      );
      return;
    }
    if (!salaryHandle) {
      setStatus("❌ Salary handle not loaded yet.");
      return;
    }
    try {
      setStatus("🔐 Decrypting salary...");
      console.info("[EmployeeSalaryPage] starting decrypt", {
        payroll: selectedPayroll,
        handle: handleToHex32(salaryHandle),
      });
      const result = await userDecryptUint64({
        chainId: sepolia.id,
        walletClient: activeWalletClient,
        contractAddress: selectedPayroll as Address,
        handle: handleToHex32(salaryHandle)
      });
      setSalaryPlain(result);
      const formatted = formatUnits(result, tokenDecimals ?? 18);
      setSalaryFormatted(formatted);
      console.info("[EmployeeSalaryPage] decrypt success", {
        raw: result.toString(),
        formatted,
      });
      setStatus("✅ Salary decrypted successfully!");
    } catch (err) {
      console.error("Failed to decrypt salary:", err);
      setStatus(`❌ Failed to decrypt salary: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const onSelectPayroll = (addr: Address | "") => {
    console.info("[EmployeeSalaryPage] payroll selected", { payroll: addr || "(none)" });
    setSelectedPayroll(addr);
    setSalaryPlain(null);
    setSalaryFormatted(null);
  };

  if (!t) return null;

  return (
    <EmployeeSalary
      locale={lang}
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
      salaryHandle={salaryHandle as string | undefined}
      salaryPlain={salaryPlain}
      salaryFormatted={salaryFormatted}
      onDecryptSalary={onDecryptSalary}

      // Status
      status={status}
    />
  );
}
