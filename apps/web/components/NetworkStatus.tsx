"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

function chainName(chainId: number) {
  switch (chainId) {
    case 11155111:
      return "Sepolia";
    case 31337:
      return "Localhost (Hardhat)";
    case 1:
      return "Ethereum Mainnet";
    case 137:
      return "Polygon";
    default:
      return `Unknown (${chainId})`;
  }
}

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();

  // Optional: read the real injected chainId from window.ethereum (helps debug “stuck” states)
  const [injectedChainId, setInjectedChainId] = useState<number | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setInjectedChainId(null);
      return;
    }

    const eth = (window as any).ethereum;
    if (!eth?.request) return;

    async function refresh() {
      try {
        const hex = await eth.request({ method: "eth_chainId" });
        setInjectedChainId(parseInt(hex, 16));
      } catch {
        // ignore
      }
    }

    refresh();

    // keep in sync when the wallet changes networks
    const onChainChanged = () => refresh();
    eth.on?.("chainChanged", onChainChanged);

    return () => {
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, [isConnected]);

  if (!isConnected) return null;

  const onSepolia = chainId === sepolia.id;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 8,
        display: "grid",
        gap: 6,
        maxWidth: 720,
      }}
    >
      <div>
        <b>Network</b>: {chainName(chainId)} — <b>chainId</b>: {chainId}
        {!onSepolia && <span style={{ color: "crimson" }}> (Wrong network)</span>}
      </div>

      {injectedChainId !== null && injectedChainId !== chainId && (
        <div style={{ color: "crimson" }}>
          ⚠️ Wallet/provider chain differs: injected={injectedChainId} vs wagmi={chainId}
        </div>
      )}

      {!onSepolia && (
        <button
          onClick={() => switchChainAsync({ chainId: sepolia.id })}
          disabled={isPending}
          style={{ width: "fit-content" }}
        >
          Switch to Sepolia
        </button>
      )}
    </div>
  );
}

export default NetworkStatus;