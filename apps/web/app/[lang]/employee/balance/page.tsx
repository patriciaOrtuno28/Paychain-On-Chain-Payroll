"use client";

import { useEffect, useState, use } from "react";
import { type Address, type Hex, formatUnits, parseEventLogs } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWalletClient, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";

import { getContracts } from "@/lib/contracts";
import { getEmployeePayrollBindings, type EmployeePayrollBinding } from "@/lib/supabasePayroll";
import { handleToHex32, userDecryptUint64, encryptUint64, getFhevmInstance } from "@/lib/fhe";

import { EmployeeBalance } from "@/components/employee/EmployeeBalance";
import { useDictionary } from "@/lib/useDictionary";
import type { Locale } from "@/i18n-config";

export default function EmployeeBalancePage({ params }: { params: Promise<{ lang: string }> }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const lang = use(params).lang;
  const t = useDictionary(lang);

  const [selectedPayroll, setSelectedPayroll] = useState<Address | "">("");
  const [bindings, setBindings] = useState<EmployeePayrollBinding[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [bindingsError, setBindingsError] = useState<string | null>(null);

  const [lastPaymentPlain, setLastPaymentPlain] = useState<bigint | null>(null);
  const [lastPaymentFormatted, setLastPaymentFormatted] = useState<string | null>(null);
  const [balancePlain, setBalancePlain] = useState<bigint | null>(null);
  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isUnwrapping, setIsUnwrapping] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: sepolia.id });

  const me = address as Address | undefined;
  const contracts = getContracts(sepolia.id);
  const payrollAddr: Address | undefined = selectedPayroll ? (selectedPayroll as Address) : undefined;

  // Load employee payroll bindings
  useEffect(() => {
    if (!me || !chainId) return;
    setBindingsLoading(true);
    setBindingsError(null);
    getEmployeePayrollBindings({ employeeWalletAddress: me, chainId })
      .then((data) => {
        setBindings(data);
        if (data.length === 1) {
          setSelectedPayroll(data[0].payroll_contract_address);
        }
      })
      .catch((err) => {
        setBindingsError(err instanceof Error ? err.message : "Failed to load payroll bindings");
      })
      .finally(() => {
        setBindingsLoading(false);
      });
  }, [me, chainId]);

  // Read token info from the wrapper contract
  const { data: tokenSymbol } = useReadContract({
    address: contracts.PayrollConfidentialWrapper.address,
    abi: [
      { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
    ] as const,
    functionName: "symbol",
    chainId: sepolia.id,
  });

  const { data: tokenDecimals } = useReadContract({
    address: contracts.PayrollConfidentialWrapper.address,
    abi: [
      { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
    ] as const,
    functionName: "decimals",
    chainId: sepolia.id,
  });

  // Read confidential balance from the wrapper contract (confidentialBalanceOf is on the wrapper, not payroll)
  const { data: balanceHandle } = useReadContract({
    address: me ? contracts.PayrollConfidentialWrapper.address : undefined,
    abi: contracts.PayrollConfidentialWrapper.abi,
    functionName: "confidentialBalanceOf",
    args: me ? [me] : undefined,
    chainId: sepolia.id,
    query: { enabled: !!me },
  });

  // Read last payment handle from payroll contract (self-call with account: me)
  const { data: lastPaymentHandle } = useReadContract({
    address: payrollAddr,
    abi: contracts.PayrollAbi,
    functionName: "myLastPayment",
    account: me,
    chainId: sepolia.id,
    query: { enabled: !!payrollAddr && !!me },
  });

  // Read last run ID
  const { data: lastRunIdData } = useReadContract({
    address: payrollAddr,
    abi: contracts.PayrollAbi,
    functionName: "myLastRunId",
    account: me,
    chainId: sepolia.id,
    query: { enabled: !!payrollAddr && !!me },
  });

  // Decrypt balance (from wrapper contract)
  const onDecryptBalance = async () => {
    if (!balanceHandle || !walletClient || !me) return;
    try {
      setStatus("🔐 Decrypting balance...");
      const result = await userDecryptUint64({
        chainId: sepolia.id,
        walletClient,
        contractAddress: contracts.PayrollConfidentialWrapper.address,
        handle: handleToHex32(balanceHandle as any),
      });
      setBalancePlain(result);
      setBalanceFormatted(formatUnits(result, tokenDecimals ?? 18));
      setStatus("✅ Balance decrypted successfully!");
    } catch (err) {
      setStatus(`❌ Failed to decrypt balance: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Decrypt last payment (from payroll contract)
  const onDecryptLastPayment = async () => {
    if (!lastPaymentHandle || !walletClient || !me || !selectedPayroll) return;
    try {
      setStatus("🔐 Decrypting last payment...");
      const result = await userDecryptUint64({
        chainId: sepolia.id,
        walletClient,
        contractAddress: selectedPayroll as Address,
        handle: handleToHex32(lastPaymentHandle as any),
      });
      setLastPaymentPlain(result);
      setLastPaymentFormatted(formatUnits(result, tokenDecimals ?? 18));
      setStatus("✅ Last payment decrypted successfully!");
    } catch (err) {
      setStatus(`❌ Failed to decrypt last payment: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Unwrap: ERC-7984 → ERC-20 (cUSDC → USDC), full 4-step flow.
  // Step 1: encrypt amount + call wrapper.unwrap() — burns cUSDC, emits UnwrapRequested
  // Step 2: wait for tx receipt, parse burntAmountHandle from UnwrapRequested event
  // Step 3: call instance.publicDecrypt([burntAmountHandle]) to get cleartext + proof from KMS
  // Step 4: call wrapper.finalizeUnwrap() — this is what actually sends USDC to the wallet
  const onRequestUnwrap = async (amountRaw: bigint, toAddress: Address) => {
    if (!me || !walletClient || !publicClient) return;
    setIsUnwrapping(true);
    try {
      // Step 1 — encrypt + submit unwrap tx
      setStatus("🔐 Encrypting amount...");
      const { handle, inputProof } = await encryptUint64({
        chainId: sepolia.id,
        contractAddress: contracts.PayrollConfidentialWrapper.address,
        userAddress: me,
        value: amountRaw,
      });

      setStatus("📤 Submitting unwrap transaction...");
      const unwrapTxHash = await writeContractAsync({
        address: contracts.PayrollConfidentialWrapper.address,
        abi: contracts.PayrollConfidentialWrapper.abi,
        functionName: "unwrap",
        args: [me, toAddress, handle, inputProof],
        chainId: sepolia.id,
        account: me,
      });

      // Step 2 — wait for receipt and get the burntAmountHandle from UnwrapRequested event
      setStatus("⏳ Waiting for transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: unwrapTxHash });

      const unwrapLogs = parseEventLogs({
        abi: contracts.PayrollConfidentialWrapper.abi,
        logs: receipt.logs,
        eventName: "UnwrapRequested",
      });

      if (!unwrapLogs.length) throw new Error("UnwrapRequested event not found in receipt. The unwrap may have failed.");
      const burntAmountHandle = (unwrapLogs[0].args as { amount: Hex }).amount;

      // Step 3 — request public decryption from the FHE gateway KMS
      // Give the KMS a moment to register the makePubliclyDecryptable request
      setStatus("🔓 Requesting FHE gateway decryption (this may take a minute)...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const instance = await getFhevmInstance(sepolia.id);
      const normalizedHandle = handleToHex32(burntAmountHandle);

      let clearValues: Record<string, unknown>;
      let decryptionProof: Hex;

      // Retry up to 10 times (~60s) in case the KMS needs more time
      let lastError: unknown;
      let success = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const result = await instance.publicDecrypt([burntAmountHandle]);
          clearValues = result.clearValues as Record<string, unknown>;
          decryptionProof = result.decryptionProof as Hex;
          success = true;
          break;
        } catch (e) {
          lastError = e;
          setStatus(`🔓 Gateway decryption pending, retrying (${attempt + 1}/10)...`);
          await new Promise((resolve) => setTimeout(resolve, 6000));
        }
      }
      if (!success) throw lastError;

      const cleartextAmount = (clearValues![normalizedHandle] ?? clearValues![burntAmountHandle]) as bigint | undefined;
      if (cleartextAmount === undefined) throw new Error("Could not retrieve decrypted amount from gateway.");

      // Step 4 — finalize: actually transfers USDC to the destination wallet
      setStatus("📤 Finalizing — sending USDC to your wallet...");
      const finalizeTxHash = await writeContractAsync({
        address: contracts.PayrollConfidentialWrapper.address,
        abi: contracts.PayrollConfidentialWrapper.abi,
        functionName: "finalizeUnwrap",
        args: [burntAmountHandle, cleartextAmount, decryptionProof!],
        chainId: sepolia.id,
        account: me,
      });

      setStatus(`✅ Done! USDC has been sent to your wallet. Finalize tx: ${finalizeTxHash}`);
    } catch (err) {
      setStatus(`❌ Unwrap failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsUnwrapping(false);
    }
  };

  const onSelectPayroll = (addr: Address) => {
    setSelectedPayroll(addr);
    setBalancePlain(null);
    setBalanceFormatted(null);
    setLastPaymentPlain(null);
    setLastPaymentFormatted(null);
  };

  if (!t) return null;

  return (
    <EmployeeBalance
      locale={lang as Locale}
      chainId={chainId}
      canUseFhe={chainId === sepolia.id}
      tokenSymbol={tokenSymbol ?? "cUSDC"}
      tokenDecimals={tokenDecimals ?? 18}
      underlyingAddr={contracts.PayrollConfidentialWrapper.address}
      userAddress={me}

      bindings={bindings}
      bindingsLoading={bindingsLoading}
      bindingsError={bindingsError}
      selectedPayroll={selectedPayroll}
      onSelectPayroll={onSelectPayroll}

      lastPaymentHandle={lastPaymentHandle ? handleToHex32(lastPaymentHandle as any) : undefined}
      lastPaymentPlain={lastPaymentPlain}
      lastPaymentFormatted={lastPaymentFormatted}
      lastRunId={lastRunIdData !== undefined && lastRunIdData !== null ? String(lastRunIdData) : undefined}
      onDecryptLastPayment={onDecryptLastPayment}

      balanceHandle={balanceHandle ? handleToHex32(balanceHandle as any) : undefined}
      balancePlain={balancePlain}
      balanceFormatted={balanceFormatted}
      onDecryptBalance={onDecryptBalance}

      onRequestUnwrap={onRequestUnwrap}
      isUnwrapping={isUnwrapping}

      status={status}
    />
  );
}
