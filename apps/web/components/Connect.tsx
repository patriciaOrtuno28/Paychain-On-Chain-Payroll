"use client";

import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Connect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <Button className="bg-[#FFD208] text-black font-medium hover:bg-[#FFD208]/90" onClick={() => connect({ connector: connectors[0] })} disabled={isPending || !connectors.length}>
        {isPending ? "Connecting..." : "CONNECT WALLET"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Connected</span>
          <Badge variant="secondary" className="text-xs">
            Chain {chainId}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {address?.slice(0, 10)}...{address?.slice(-8)}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        Disconnect
      </Button>
    </div>
  );
}

export default Connect;
