export * from "./types";

import * as localhost from "./generated/localhost";
import * as sepolia from "./generated/sepolia";

export { localhost, sepolia };

export const sdkByChainId = {
  31337: localhost,
  11155111: sepolia,
} as const;
