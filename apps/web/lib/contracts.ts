import type { Abi, Address } from "viem";
import { sdkByChainId } from "@payroll/sdk";

export type DeployedContractRef = { address: Address; abi: Abi };

export type PayrollSdkContracts = {
  PayrollFactoryRegistry: DeployedContractRef;
  PayrollConfidentialWrapper: DeployedContractRef;
  PayrollAbi: Abi; // ABI only (Payroll deployed dynamically by registry)
};

export function getContracts(chainId: number): PayrollSdkContracts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdk: any = (sdkByChainId as any)[chainId];
  if (!sdk) throw new Error(`Unsupported chainId: ${chainId}`);

  const PayrollFactoryRegistry = sdk.PayrollFactoryRegistry;

  // Wwrapper-based architecture for the token
  const PayrollConfidentialWrapper = sdk.PayrollConfidentialWrapper ?? sdk.PayrollToken;

  // ABI-only Payroll (deployed dynamically by registry)
  const PayrollAbi = sdk.PayrollAbi ?? sdk.Payroll?.abi;

  if (!PayrollFactoryRegistry || !PayrollConfidentialWrapper || !PayrollAbi) {
    throw new Error(
      `SDK missing required exports for chainId=${chainId}. ` +
        `Expected PayrollFactoryRegistry, PayrollConfidentialWrapper, PayrollAbi. ` +
        `Did you run contracts:export for that network?`
    );
  }

  return { PayrollFactoryRegistry, PayrollConfidentialWrapper, PayrollAbi };
}