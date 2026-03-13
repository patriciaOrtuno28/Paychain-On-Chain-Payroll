import { createConfig, http } from "wagmi";
import type { Chain } from "wagmi/chains";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const localhost: Chain = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

export const chains = [sepolia, localhost] as const;

const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [sepolia.id]: sepoliaRpc ? http(sepoliaRpc) : http(),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

// apps/web/lib/wagmi.ts
// PRODUCTION READY VERSION WITHOUT LOCALHOST CHAIN
// import { createConfig, http } from "wagmi";
// import { sepolia } from "wagmi/chains";
// import { injected } from "wagmi/connectors";

// const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

// export const chains = [sepolia] as const;

// export const wagmiConfig = createConfig({
//   chains,
//   connectors: [injected()],
//   transports: {
//     [sepolia.id]: sepoliaRpc ? http(sepoliaRpc) : http(),
//   },
//   ssr: true,
// });