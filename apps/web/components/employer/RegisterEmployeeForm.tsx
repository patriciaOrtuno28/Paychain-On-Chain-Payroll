"use client";

import { useState, useMemo } from "react";
import { isAddress, parseUnits, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { encryptUint64 } from "@/lib/fhe";
import { registerEmployee } from "@/lib/supabasePayroll";
import type { PayrollCadence } from "@/lib/supabasePayroll";
import type { Abi } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/useDictionary";

type DniTypeKey = "DNI" | "NIE" | "NIF" | "PASSPORT";

const DNI_TYPE_KEYS: DniTypeKey[] = ["DNI", "NIE", "NIF", "PASSPORT"];
const CADENCE_KEYS: PayrollCadence[] = ["monthly", "semiMonthly", "weekly"];

type Props = {
  payrollAddr: Address;
  payrollAbi: Abi;
  companyOnchainBindingId: string;
  underlyingDecimals: number;
  underlyingSymbol: string;
  onSuccess: () => void;
  t: Dictionary["registerEmployeeForm"];
};

export function RegisterEmployeeForm({
  payrollAddr,
  payrollAbi,
  companyOnchainBindingId,
  underlyingDecimals,
  underlyingSymbol,
  onSuccess,
  t,
}: Props) {
  const { address: me } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [dniType, setDniType] = useState<DniTypeKey>("DNI");
  const [dniValue, setDniValue] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  });

  const [walletAddress, setWalletAddress] = useState("");
  const [salaryInput, setSalaryInput] = useState("1000");
  const [payrollCadence, setPayrollCadence] = useState<PayrollCadence>("monthly");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const canUseFhe = chainId === sepolia.id;

  const publicClient = usePublicClient();

  const salaryBaseUnits = useMemo(() => {
    try {
      return parseUnits(salaryInput || "0", underlyingDecimals);
    } catch {
      return null;
    }
  }, [salaryInput, underlyingDecimals]);

  const isSuccess = status.startsWith("✅");
  const isError = status.startsWith("❌");

  function getErrorName(e: unknown): string | undefined {
    const anyE = e as any;
    return (
      anyE?.cause?.data?.errorName ??
      anyE?.data?.errorName ??
      anyE?.cause?.name ??
      anyE?.name
    );
  }

  async function handleRegister() {
    if (!me) return setStatus(`❌ ${t.errors.connectWallet}`);
    if (!isAddress(walletAddress)) return setStatus(`❌ ${t.errors.invalidAddress}`);
    if (!givenName.trim() || !familyName.trim()) return setStatus(`❌ ${t.errors.nameRequired}`);
    if (!dniValue.trim()) return setStatus(`❌ ${t.errors.idRequired}`);
    if (!salaryBaseUnits || salaryBaseUnits <= 0n) return setStatus(`❌ ${t.errors.invalidSalary}`);
    if (!canUseFhe) return setStatus(`❌ ${t.errors.switchToSepolia}`);
    if (!publicClient) return setStatus(`❌ Public client not ready`);

    const employee = walletAddress as Address;

    setLoading(true);
    setStatus("");

    try {
      // 1) Add employee on-chain (skip if already active)
      setStatus(`⛓️ ${t.statusMessages.addingOnChain}`);

      const alreadyActive = await publicClient.readContract({
        address: payrollAddr,
        abi: payrollAbi,
        functionName: "isEmployee",
        args: [employee],
      }).catch(() => false) as boolean;

      if (!alreadyActive) {
        const addHash = await writeContractAsync({
          address: payrollAddr,
          abi: payrollAbi,
          functionName: "addEmployee",
          args: [employee],
          chainId,
          account: me,
        });

        await publicClient.waitForTransactionReceipt({ hash: addHash });
      }

      // 2) Encrypt + set salary on-chain
      setStatus(`🔐 ${t.statusMessages.encryptingSalary}`);

      const UINT64_MAX = (1n << 64n) - 1n;
      if (salaryBaseUnits > UINT64_MAX) {
        setLoading(false);
        return setStatus(`❌ ${t.errors.salaryTooLarge}`);
      }

      const { handle, inputProof } = await encryptUint64({
        chainId,
        contractAddress: payrollAddr,
        userAddress: me,
        value: salaryBaseUnits,
      });

      setStatus(`⛓️ ${t.statusMessages.settingSalary}`);

      const salaryHash = await writeContractAsync({
        address: payrollAddr,
        abi: payrollAbi,
        functionName: "setSalary",
        args: [employee, handle, inputProof],
        chainId,
        account: me,
      });

      await publicClient.waitForTransactionReceipt({ hash: salaryHash });

      // 3) ✅ Only now write to Supabase
      setStatus(`💾 ${t.statusMessages.savingToDatabase}`);

      await registerEmployee(
        {
          company_onchain_binding_id: companyOnchainBindingId,
          chain_id: chainId,
          wallet_address: employee,
          given_name: givenName.trim(),
          family_name: familyName.trim(),
          dni_type: dniType,
          dni_value: dniValue.trim(),
          email: email.trim() || undefined,
          job_title: jobTitle.trim() || undefined,
          start_date: startDate,
          payroll_cadence: payrollCadence,
        },
        me
      );

      setStatus(`✅ ${t.statusMessages.success}: ${salaryHash}`);

      // reset only on full success
      setGivenName("");
      setFamilyName("");
      setDniValue("");
      setEmail("");
      setJobTitle("");
      setWalletAddress("");
      setSalaryInput("1000");
      setPayrollCadence("monthly");

      onSuccess();
    } catch (e) {
      const name = getErrorName(e);
      if (name === "UserRejectedRequestError") {
        setStatus("❌ Transaction rejected in wallet. Nothing was saved to the database.");
      } else {
        setStatus(`❌ ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-card border-primary/30 col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Row 1 – Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.givenName}</p>
            <Input
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              placeholder={t.givenNamePlaceholder}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.familyName}</p>
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t.familyNamePlaceholder}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
        </div>

        {/* Row 2 – ID type + ID value */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.idType}</p>
            <select
              value={dniType}
              onChange={(e) => setDniType(e.target.value as DniTypeKey)}
              className="w-full bg-muted border-border text-foreground h-9 px-3 text-sm rounded"
            >
              {DNI_TYPE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t.dniTypes[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.idValue}</p>
            <Input
              value={dniValue}
              onChange={(e) => setDniValue(e.target.value)}
              placeholder={t.idValuePlaceholder}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
        </div>

        {/* Row 3 – Email + Job title + Start date */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.email}</p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.jobTitle}</p>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={t.jobTitlePlaceholder}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.startDate}</p>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Row 4 – Cadence + Wallet + Salary */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.cadenceLabel}</p>
            <select
              value={payrollCadence}
              onChange={(e) => setPayrollCadence(e.target.value as PayrollCadence)}
              className="w-full bg-muted border-border text-foreground h-9 px-3 text-sm rounded"
            >
              {CADENCE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t.cadenceOptions[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {t.walletAddress}{" "}
              <span className="normal-case text-muted-foreground/60">— {t.walletAddressNote}</span>
            </p>
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="bg-muted border-border text-foreground h-9 text-sm font-mono"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {t.salaryLabels[payrollCadence]} ({underlyingSymbol})
            </p>
            <Input
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="1000.00"
              inputMode="decimal"
              className="bg-muted border-border text-foreground h-9 text-sm"
            />
          </div>
        </div>

        {/* Salary preview */}
        {salaryBaseUnits !== null && (
          <p className="text-[11px] text-muted-foreground font-mono">
            {t.internalUnits}: {salaryBaseUnits.toString()} {t.baseUnits} — {salaryInput} {underlyingSymbol}
          </p>
        )}

        {/* Privacy note */}
        <div className="bg-muted/60 border border-border px-3 py-2 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t.privacyNote}</p>
        </div>

        {/* Submit button */}
        <Button
          onClick={() => handleRegister().catch((e) => setStatus(`❌ ${String(e.message ?? e)}`))}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          {loading ? t.registeringButton : t.registerButton}
        </Button>

        {/* Status message */}
        {status && (
          <div
            className={`px-3 py-2 text-sm border ${isSuccess
              ? "bg-success/10 text-success-foreground border-success/20"
              : isError
                ? "bg-destructive/10 text-destructive-foreground border-destructive/20"
                : "bg-muted text-foreground border-border"
              }`}
          >
            {status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
