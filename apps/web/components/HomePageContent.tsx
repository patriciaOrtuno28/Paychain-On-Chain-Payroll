"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { type Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { Shield, Lock, Building2, User, ChevronRight, Activity, CheckCircle2, Loader2 } from "lucide-react";

import { ClientOnly } from "@/components/ClientOnly";
import { Connect } from "@/components/Connect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getContracts } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/lib/useDictionary";
import type { Locale } from "@/i18n-config";

import { keccak256, stringToHex } from "viem";

import { upsertCompanyRegistration, getEmployerCompanyBinding } from "@/lib/supabasePayroll";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

interface HomePageContentProps {
  locale: Locale;
}

export function HomePageContent({ locale }: HomePageContentProps) {
  const dict = useDictionary(locale);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const [countryCode, setCountryCode] = useState("ES");
  const [pendingCompanyDraft, setPendingCompanyDraft] = useState<{
    company_id: string;
    legal_name: string;
    country_code: string;
  } | null>(null);

  const [supabaseCompanyName, setSupabaseCompanyName] = useState<string | null>(null);

  const waitTx = useWaitForTransactionReceipt({ hash: txHash ?? undefined });

  function fmtErr(e: unknown): string {
    if (e instanceof Error) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }

  // Define a state for the registry contract instance
  const contracts = useMemo(() => {
    try {
      return getContracts(chainId);
    } catch {
      return null;
    }
  }, [chainId]);

  // Extract the registry contract for easier access
  const me = address as Address | undefined;
  const onSepolia = chainId === sepolia.id;

  // Get registry address on-chain for the connected wallet
  const registry = contracts?.PayrollFactoryRegistry;

  // Get the payroll address associated with the connected wallet (if any)
  const myCompany = useReadContract(
    registry && me
      ? {
          address: registry.address,
          abi: registry.abi,
          functionName: "myCompany",
          account: me, // optional, but harmless
        }
      : undefined
  );

  const payrollAddr = (myCompany.data as Address | undefined) ?? ZERO;
  const hasOnchainCompany = payrollAddr !== ZERO;

  const isSupabaseSynced = !!supabaseCompanyName;
  const needsSupabaseSync = hasOnchainCompany && !isSupabaseSynced;

  const draftStorageKey = useMemo(() => {
    if (!me) return null;
    return `pendingCompanyDraft:${chainId}:${me.toLowerCase()}`;
  }, [me, chainId]);

  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [supabaseSyncError, setSupabaseSyncError] = useState<string | null>(null);

  // Load company metadata from Supabase if wallet is connected
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!me) {
        if (!cancelled) {
          setSupabaseCompanyName(null);
          setSupabaseSyncError(null);
        }
        return;
      }

      try {
        const binding = await getEmployerCompanyBinding({
          employerWalletAddress: me,
          chainId,
        });

        if (!cancelled) {
          setSupabaseCompanyName(binding?.company?.legal_name ?? null);
        }
      } catch (e) {
        if (!cancelled) setStatus(fmtErr(e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [me, chainId]);

  // Persist Supabase state after on-chain tx confirmation
  useEffect(() => {
    if (!waitTx.isSuccess) return;

    (async () => {
      try {
        setStatus("✅ On-chain confirmed. Syncing backend...");

        // Refetch myCompany so we get the freshly-deployed payroll address.
        // The component closure still holds the old (stale) value, so we
        // must pass the fresh address explicitly into syncSupabaseFromInputsOrDraft.
        const refetchResult = await myCompany.refetch?.();
        const freshPayrollAddr = refetchResult?.data as Address | undefined;

        await syncSupabaseFromInputsOrDraft(freshPayrollAddr);

        setTxHash(null);
      } catch (e) {
        setStatus(`❌ On-chain confirmed, but backend sync failed: ${fmtErr(e)}`);
        setTxHash(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitTx.isSuccess]);

  // Sync/repair Supabase for an already-deployed on-chain payroll.
  // Pass freshPayrollAddr when the on-chain state may not yet be reflected in the
  // component closure (e.g. right after a waitTx confirmation).
  async function syncSupabaseFromInputsOrDraft(freshPayrollAddr?: Address) {
    if (!me) throw new Error("Connect wallet");
    if (!draftStorageKey) throw new Error("Missing storage key");

    // Prefer the explicitly-passed fresh address; fall back to stale closure value.
    const effectivePayrollAddr = freshPayrollAddr ?? payrollAddr;
    if (!effectivePayrollAddr || effectivePayrollAddr === ZERO) throw new Error("No on-chain payroll found");

    setSyncingSupabase(true);
    setSupabaseSyncError(null);

    try {
      // 1) Try localStorage draft first (if a previous attempt partially succeeded)
      let draft = pendingCompanyDraft;

      if (!draft) {
        const raw = localStorage.getItem(draftStorageKey);
        if (raw) {
          try {
            draft = JSON.parse(raw);
          } catch {}
        }
      }

      // 2) If no draft exists, create one from the current input fields
      if (!draft) {
        if (!companyName.trim()) throw new Error("Company name is required to complete backend sync");
        if (!countryCode.trim()) throw new Error("Country code is required to complete backend sync");

        draft = {
          company_id: crypto.randomUUID(),
          legal_name: companyName.trim(),
          country_code: countryCode.trim().toUpperCase(),
        };
      }

      // 3) Persist draft so refresh doesn’t lose it
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setPendingCompanyDraft(draft);

      await upsertCompanyRegistration({
        ...draft,
        chain_id: chainId,
        employer_wallet_address: me,
        payroll_contract_address: effectivePayrollAddr,
      });

      setSupabaseCompanyName(draft.legal_name);
      setStatus("✅ Backend sync completed");
      localStorage.removeItem(draftStorageKey);
      setPendingCompanyDraft(null);
    } catch (e) {
      const msg = fmtErr(e);
      setSupabaseSyncError(msg);
      setStatus(`❌ Supabase sync failed: ${msg}`);
    } finally {
      setSyncingSupabase(false);
    }
  }

  // Auto-attempt repair if on-chain is registered but Supabase is missing
  useEffect(() => {
    if (!needsSupabaseSync) return;
    if (!draftStorageKey) return;

    // If there’s a stored draft from a previous attempt, try syncing automatically.
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;

    // Fire-and-forget (don’t block render)
    syncSupabaseFromInputsOrDraft().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSupabaseSync, draftStorageKey]);

  // Main registration flow: on-chain and Supabase in a single function for better error handling and user feedback
  async function registerCompany() {
    if (!registry || !me) throw new Error(dict?.status.connectWalletFirst || "Connect wallet first");
    if (!onSepolia) throw new Error(dict?.status.pleaseSwitchToSepolia || "Please switch to Sepolia");

    // ── Pre-flight: check on-chain registry before touching MetaMask ──────────
    // Fetch the latest state from the chain so we don't rely on a possibly stale cache.
    const freshResult = await myCompany.refetch?.();
    const freshPayrollAddr = freshResult?.data as Address | undefined;
    const alreadyOnchain = !!freshPayrollAddr && freshPayrollAddr !== ZERO;

    if (alreadyOnchain) {
      if (isSupabaseSynced) {
        // Both on-chain and Supabase are up-to-date — nothing to do.
        setStatus("✅ Your company is already fully registered. Go to the Employer Dashboard to manage it.");
        return;
      }
      // On-chain exists but Supabase sync is missing — repair it.
      setStatus("On-chain payroll found. Completing backend sync...");
      await syncSupabaseFromInputsOrDraft(freshPayrollAddr);
      return;
    }

    // ── Validate form fields only when we are about to fire a real tx ─────────
    if (!companyName.trim()) throw new Error(dict?.status.companyNameRequired || "Company name is required");
    if (!countryCode.trim()) throw new Error("Country code is required");

    const draft = {
      company_id: crypto.randomUUID(),
      legal_name: companyName.trim(),
      country_code: countryCode.trim().toUpperCase(),
    };

    const companyRef = keccak256(stringToHex(draft.company_id));
    setPendingCompanyDraft(draft);

    if (draftStorageKey) {
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    }

    setStatus("Registering company on-chain...");
    try {
      const hash = await writeContractAsync({
        chainId,
        account: me,
        address: registry.address,
        abi: registry.abi,
        functionName: "registerCompany",
        args: [companyRef],
      });

      setTxHash(hash);
      setStatus(dict?.status.transactionSubmitted || "Transaction submitted");
    } catch (e) {
      // Detect contract-level "CompanyAlreadyRegistered" revert and show a friendly message.
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("CompanyAlreadyRegistered")) {
        setStatus("✅ Your company is already registered on-chain. Refreshing state…");
        await myCompany.refetch?.();
      } else {
        throw e; // re-throw other errors so the outer catch can display them
      }
    }
  }

  if (!dict) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-wider">PAYCHAINME</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href={`/${locale}`} className="text-xs font-medium tracking-widest text-muted-foreground hover:text-foreground">{dict.nav.platformAdmin}</Link>
            <Link href={`/${locale}/employer/dashboard`} className="text-xs font-medium tracking-widest text-muted-foreground hover:text-foreground">{dict.nav.employer}</Link>
            <Link href={`/${locale}/employee`} className="text-xs font-medium tracking-widest text-muted-foreground hover:text-foreground">{dict.nav.employee}</Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {dict.common.devnetActive}
              </span>
            </Badge>
            <ClientOnly>
              <ThemeToggle />
            </ClientOnly>
            <ClientOnly>
              <LanguageSwitcher />
            </ClientOnly>
            <ClientOnly fallback={<div className="h-9 w-32" />}>
              <Connect />
            </ClientOnly>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-border/50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary">{dict.common.poweredByZamaFhe}</span>
          </div>

          <h1 className="mb-6 text-6xl font-bold leading-[1.1] tracking-tight">
            {dict.hero.titleLine1}<br />
            {dict.hero.titleLine2}<br />
            {dict.hero.titleLine3}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            {dict.hero.description}
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="border-b border-border/50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3">
            {/* Employer Onboarding Card */}
            <div className="border-r border-border/50 p-8 lg:col-span-2">
              <Card className="border-border/50 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold tracking-wider text-card-foreground">{dict.employerOnboarding.title}</CardTitle>
                    <CardDescription className="text-xs tracking-[0.15em] text-muted-foreground/60">
                      {dict.employerOnboarding.registryStatus}: <span className={hasOnchainCompany ? "text-success" : "text-destructive"}>
                        {hasOnchainCompany ? dict.employerOnboarding.registered : dict.employerOnboarding.unregistered}
                      </span>
                    </CardDescription>
                  </div>
                  <Shield className="h-5 w-5 text-primary" />
                </CardHeader>

                <CardContent className="flex flex-col gap-6">
                  {!hasOnchainCompany ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {dict.employerOnboarding.description}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70"
                          htmlFor="companyName"
                        >
                          {dict.employerOnboarding.companyNameLabel}
                        </label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder={dict.employerOnboarding.companyNamePlaceholder}
                          className="border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                        />
                        <p className="text-[10px] text-muted-foreground/50">
                          <Lock className="inline h-3 w-3 mr-1" />
                          {dict.employerOnboarding.companyNameNote}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70"
                          htmlFor="countryCode"
                        >
                          Country code (ISO-2)
                        </label>
                        <Input
                          id="countryCode"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                          placeholder="ES"
                          maxLength={2}
                          className="border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>

                      <Button
                        onClick={() => registerCompany().catch((e) => setStatus(fmtErr(e)))}
                        disabled={!onSepolia || waitTx.isLoading}
                        className="h-12 bg-primary text-primary-foreground font-bold tracking-wider hover:bg-primary/90"
                        size="lg"
                      >
                        {dict.common.registerCompany} <ChevronRight className="h-4 w-4" />
                      </Button>

                      {!onSepolia && (
                        <Badge variant="destructive" className="w-fit">
                          {dict.employerOnboarding.switchToSepolia}
                        </Badge>
                      )}
                    </>
                  ) : !isSupabaseSynced ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        ✅ On-chain payroll found, but backend setup is incomplete (Supabase missing).
                        Enter company info to finish setup.
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Payroll contract:</span>{" "}
                        <code className="font-mono text-xs">{payrollAddr}</code>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70"
                          htmlFor="companyName"
                        >
                          {dict.employerOnboarding.companyNameLabel}
                        </label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="border-border/50 bg-background/50"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/70"
                          htmlFor="countryCode"
                        >
                          Country code (ISO-2)
                        </label>
                        <Input
                          id="countryCode"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                          maxLength={2}
                          className="border-border/50 bg-background/50"
                        />
                      </div>

                      <Button
                        onClick={() => syncSupabaseFromInputsOrDraft().catch((e) => setStatus(fmtErr(e)))}
                        disabled={syncingSupabase}
                        className="h-12 bg-primary text-primary-foreground font-bold tracking-wider hover:bg-primary/90"
                        size="lg"
                      >
                        {syncingSupabase ? "Syncing..." : "Complete setup"} <ChevronRight className="h-4 w-4" />
                      </Button>

                      {supabaseSyncError && (
                        <div className="text-xs text-destructive">
                          Supabase error: {supabaseSyncError}
                          <div className="mt-1 text-muted-foreground/70">
                            (If it says 401, you need RLS policies or a server route using service_role.)
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{dict.employerOnboarding.companyAlreadyRegistered}</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{dict.employerOnboarding.payrollContract}:</span>{" "}
                        <code className="font-mono text-xs">{payrollAddr}</code>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{dict.employerOnboarding.companyName}:</span>{" "}
                        {supabaseCompanyName ?? dict.common.loading}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/${locale}/employer/dashboard`}>
                          <Button className="bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                            {dict.common.goToEmployerDashboard}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/employee`}>
                          <Button variant="outline" className="border-border/50 text-foreground hover:bg-muted/50">
                            {dict.common.employeePortal}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Status Bar (always present) */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-[10px]">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="tracking-wider">{dict.employerOnboarding.registryCheckActive}</span>
                    </div>
                    {waitTx.isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground/60">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="tracking-wider">{dict.employerOnboarding.loadingState}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6 p-8">
              {/* System Status Card */}
              <Card className="border-border/50 bg-background">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    {dict.systemStatus.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground/70">{dict.systemStatus.registryStatus}</span>
                    <span className={hasOnchainCompany ? "text-success" : "text-destructive"}>
                      {hasOnchainCompany ? dict.employerOnboarding.registered : dict.employerOnboarding.unregistered}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground/70">{dict.systemStatus.walletConnection}</span>
                    <span className={isConnected ? "text-primary" : "text-muted-foreground/50"}>
                      {isConnected ? dict.common.connected : dict.common.notConnected}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground/70">{dict.systemStatus.encryptedSession}</span>
                    <span className="text-primary">{dict.common.active}</span>
                  </div>

                  {/* Scanning Status */}
                  <div className="mt-2 flex items-center gap-3 border-t border-border/50 bg-muted/30 p-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border/50">
                      <Activity className="h-4 w-4 text-muted-foreground/70" />
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">
                      {dict.systemStatus.scanningBlockchain}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Secure Vault Card */}
              <Card className="border-none bg-primary">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold tracking-tight text-primary-foreground">
                      {dict.secureVault.title.split(" ").map((word, i) => (
                        <span key={i}>{word}<br /></span>
                      ))}
                    </CardTitle>
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium tracking-wide text-primary-foreground">
                    {dict.secureVault.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Architecture Section */}
      <section className="border-b border-border/50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-xs font-bold tracking-[0.3em] text-muted-foreground/60">
            {dict.protocolArchitecture.title}
          </h2>

          <div className="grid gap-px bg-border/50 md:grid-cols-3">
            {/* Platform Admin */}
            <div className="bg-background p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center border border-border/70">
                <svg className="h-6 w-6 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{dict.protocolArchitecture.platformAdmin.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground/70">
                {dict.protocolArchitecture.platformAdmin.description}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground/70">
                {dict.protocolArchitecture.platformAdmin.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Employer */}
            <div className="border-x border-border/50 bg-background p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center border border-border/70">
                <Building2 className="h-6 w-6 text-muted-foreground/70" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{dict.protocolArchitecture.employer.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground/70">
                {dict.protocolArchitecture.employer.description}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground/70">
                {dict.protocolArchitecture.employer.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Employee */}
            <div className="bg-background p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center border border-border/70">
                <User className="h-6 w-6 text-muted-foreground/70" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{dict.protocolArchitecture.employee.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground/70">
                {dict.protocolArchitecture.employee.description}
              </p>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground/70">
                {dict.protocolArchitecture.employee.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1 w-1 bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20">
                <Lock className="h-3 w-3 text-primary" />
              </div>
              <span className="tracking-wider">{dict.footer.zamaFheEncrypted}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20">
                <Activity className="h-3 w-3 text-primary" />
              </div>
              <span className="tracking-wider">{dict.footer.ethereumMainnetReady}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[10px] text-muted-foreground/60">
            <a href="#" className="tracking-widest hover:text-foreground">{dict.common.documentation}</a>
            <a href="#" className="tracking-widest hover:text-foreground">{dict.common.api}</a>
            <a href="#" className="tracking-widest hover:text-foreground">{dict.common.support}</a>
            <span className="text-muted-foreground/50">{dict.common.copyright}</span>
          </div>
        </div>
      </footer>

      {/* Status Toast */}
      {status && (() => {
        const isSuccess = status.startsWith("✅") || status.includes("successfully");
        const isError = status.startsWith("❌");
        return (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm">
            <Card className={`border ${isSuccess ? "border-green-500/50" : isError ? "border-destructive/50" : "border-border/70"}`}>
              <CardContent className="flex items-start gap-3 p-4">
                {isSuccess ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                ) : isError ? (
                  <svg className="h-5 w-5 shrink-0 text-destructive mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                  </svg>
                ) : (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground break-words">{status}</span>
                  {(isSuccess || isError) && (
                    <button
                      onClick={() => setStatus("")}
                      className="mt-2 block text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
