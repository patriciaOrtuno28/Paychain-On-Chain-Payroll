"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n-config";

export interface Dictionary {
  common: {
    platformAdmin: string;
    employer: string;
    employee: string;
    devnetActive: string;
    poweredByZamaFhe: string;
    loading: string;
    none: string;
    success: string;
    error: string;
    confirm: string;
    cancel: string;
    save: string;
    close: string;
    back: string;
    next: string;
    register: string;
    connected: string;
    notConnected: string;
    active: string;
    inactive: string;
    encrypted: string;
    decrypted: string;
    registerCompany: string;
    goToEmployerDashboard: string;
    employeePortal: string;
    documentation: string;
    api: string;
    support: string;
    copyright: string;
  };

  nav: {
    platformAdmin: string;
    employer: string;
    employee: string;
  };

  hero: {
    title: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
  };

  employerOnboarding: {
    title: string;
    registryStatus: string;
    registered: string;
    unregistered: string;
    description: string;
    companyNameLabel: string;
    companyNamePlaceholder: string;
    companyNameNote: string;
    switchToSepolia: string;
    companyAlreadyRegistered: string;
    payrollContract: string;
    companyName: string;
    registryCheckActive: string;
    loadingState: string;
  };

  systemStatus: {
    title: string;
    registryStatus: string;
    walletConnection: string;
    encryptedSession: string;
    scanningBlockchain: string;
  };

  secureVault: {
    title: string;
    description: string;
  };

  protocolArchitecture: {
    title: string;
    platformAdmin: {
      title: string;
      description: string;
      features: string[];
    };
    employer: {
      title: string;
      description: string;
      features: string[];
    };
    employee: {
      title: string;
      description: string;
      features: string[];
    };
  };

  footer: {
    zamaFheEncrypted: string;
    ethereumMainnetReady: string;
  };

  status: {
    companyRegistering: string;
    transactionSubmitted: string;
    companyRegisteredSuccessfully: string;
    connectWalletFirst: string;
    pleaseSwitchToSepolia: string;
    companyNameRequired: string;
    thisWalletAlreadyHasCompany: string;
  };

  employerDashboard: {
    title: string;
    securedByFhe: string;
    exportCsv: string;
    runPayroll: string;

    registryInformation: string;
    companyRegistry: string;
    tokenAddress: string;
    controllerContract: string;

    operatorControls: string;
    isOperatorStatus: string;
    authorizedSession: string;
    renewalPeriodDays: string;
    update: string;
    revokeAllAccess: string;

    provisionEmployee: string;
    walletAddress: string;
    salary: string;
    period: string;
    period30Days: string;
    period15Days: string;
    period7Days: string;
    addUser: string;
    setSalary: string;

    confidentialTreasury: string;
    encryptedBalance: string;
    decrypt: string;
    decryptionNote: string;

    activePayrollRoster: string;
    count: string;
    employeeAddress: string;
    status: string;
    actions: string;
    loadingEmployees: string;
    noEmployeesRegistered: string;
    paid: string;
    pending: string;
    showing: string;
    of: string;
    employees: string;
    prev: string;
    next: string;

    confidentialView: string;
    selectEmployee: string;
    selectFromRoster: string;
    salaryPlaintext: string;
    historyDecryption: string;
    decryptionWarning: string;

    zamaDevnet: string;
    latency: string;
    copyright: string;

    noCompanyWarning: string;
    supabaseNotSynced: string;
    supabaseError: string;

    fundingSection: {
      title: string;
      underlyingLabel: string;
      symbolLabel: string;
      decimalsLabel: string;
      balanceLabel: string;
      amountToWrapLabel: string;
      approveButton: string;
      wrapButton: string;
      flowNote: string;
    };

    // Present in your es.json (even if you removed the UI card)
    payrollPeriod?: {
      title: string;
      cadence: string;
      cadenceMonthly: string;
      cadenceSemiMonthly: string;
      cadenceWeekly: string;
      cadenceDev30m: string;
      reference: string;
      computedPeriod: string;
      runId: string;
      runBatch: string;
      runSelected: string;
      note: string;
    };

    // Present in your es.json
    editEmployeePlaceholder?: {
      title: string;
      body: string;
    };
  };

  registerEmployeeForm: {
    title: string;
    givenName: string;
    givenNamePlaceholder: string;
    familyName: string;
    familyNamePlaceholder: string;
    idType: string;
    idValue: string;
    idValuePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    jobTitle: string;
    jobTitlePlaceholder: string;
    startDate: string;
    walletAddress: string;
    walletAddressNote: string;
    monthlySalary: string;

    // present in your es.json
    cadenceLabel: string;
    cadenceOptions: {
      monthly: string;
      semiMonthly: string;
      weekly: string;
    };
    salaryLabels: {
      monthly: string;
      semiMonthly: string;
      weekly: string;
    };

    internalUnits: string;
    baseUnits: string;
    privacyNote: string;
    registerButton: string;
    registeringButton: string;
    dniTypes: {
      DNI: string;
      NIE: string;
      NIF: string;
      PASSPORT: string;
    };
    errors: {
      connectWallet: string;
      invalidAddress: string;
      nameRequired: string;
      idRequired: string;
      invalidSalary: string;
      switchToSepolia: string;
      salaryTooLarge: string;
    };
    statusMessages: {
      savingToDatabase: string;
      addingOnChain: string;
      encryptingSalary: string;
      settingSalary: string;
      success: string;
    };
  };

  employeeRoster: {
    title: string;
    count: string;
    total: string;
    active: string;

    columnWallet: string;
    columnJobTitle: string;
    columnSince: string;

    // present in your es.json
    columnCadence: string;
    columnNextDue: string;

    columnStatus: string;
    columnActions: string;

    noTitle: string;
    statusActive: string;
    statusInactive: string;
    inspect: string;
    remove: string;
    removeConfirm: string;
    loading: string;
    empty: string;
  };

  editEmployeePanel: {
    title: string;
    wallet: string;
    active: string;
    inactive: string;

    offchainSectionTitle: string;
    jobTitle: string;
    jobTitlePlaceholder: string;
    startDate: string;
    employmentStatus: string;
    employmentStatusHint: string;
    activeToggle: string;
    payrollCadenceLabel: string;

    saveChanges: string;
    saving: string;
    reset: string;
    unsavedChanges: string;
    saved: string;

    salarySectionTitle: string;
    newSalary: string;
    updateSalary: string;
    salaryEncryptedHint: string;

    payrollSectionTitle: string;
    selectedPeriod: string;
    runId: string;
    runPayrollForThisEmployee: string;
  };

  employeePage: {
    title: string;
    securedByFhe: string;
    connectWallet: string;
    contractsNotLoaded: string;
    networkTitle: string;
    chainId: string;
    fheEnabled: string;
    fheDisabled: string;
    token: string;
    loading: string;
  };

  employeeCompanySelector: {
    title: string;
    loading: string;
    errorPrefix: string;
    noAssociation: string;
    noAssociationHint: string;
    foundContracts: string;
    company: string;
    payrollContract: string;
    selectCompany: string;
    selectPlaceholder: string;
  };

  employeeSalaryPanel: {
    salaryTitle: string;
    lastPaymentTitle: string;
    handle: string;
    lastRunId: string;
    loading: string;
    none: string;
    decryptSalary: string;
    decryptLastPayment: string;
    decryptingSalary: string;
    decryptingLastPayment: string;
    salaryDecrypted: string;
    lastPaymentDecrypted: string;
    raw: string;
    errorCannotReadSalary: string;
    errorNotEmployee: string;
    errorCannotReadLastPayment: string;
    errorSwitchToSepolia: string;
  };

  employeeBalancePanel: {
    title: string;
    handle: string;
    loading: string;
    decryptButton: string;
    decrypting: string;
    decrypted: string;
    raw: string;
    note: string;
    errorSwitchToSepolia: string;
    errorMissingHandle: string;
  };
  employeeSidebar: {
    navigation: string;
    dashboard: string;
    mySalary: string;
    myBalance: string;
    settings: string;
    help: string;
  };
  employerSidebar: {
    navigation: string;
    dashboard: string;
    roster: string;
    registerEmployee: string;
    runPayroll: string;
    settings: string;
    help: string;
  };
}

async function loadDictionary(locale: Locale): Promise<Dictionary> {
  const module = await import(`@/dictionaries/${locale}.json`);
  return module.default;
}

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loadDictionary(locale);
}

export function useDictionary(locale: Locale) {
  const [dict, setDict] = useState<Dictionary | null>(null);

  useEffect(() => {
    loadDictionary(locale).then(setDict);
  }, [locale]);

  return dict;
}
