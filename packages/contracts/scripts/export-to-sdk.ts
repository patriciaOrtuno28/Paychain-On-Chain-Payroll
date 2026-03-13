import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type DeploymentJson = {
  address?: string;
  abi?: unknown;
};

type ArtifactJson = {
  contractName?: string;
  abi?: unknown;
};

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function isHexAddress(x: unknown): x is `0x${string}` {
  return typeof x === "string" && /^0x[a-fA-F0-9]{40}$/.test(x);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeTsIdentifier(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[a-zA-Z_$]/.test(sanitized) ? sanitized : `_${sanitized}`;
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function walkDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkDir(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }

  return out;
}

const network = getArg("--network") ?? "localhost";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const deploymentsDir = path.join(process.cwd(), "deployments", network);
const artifactsContractsDir = path.join(process.cwd(), "artifacts", "contracts");

const sdkGeneratedDir = path.join(repoRoot, "packages", "sdk", "src", "generated");
const outFile = path.join(sdkGeneratedDir, `${network}.ts`);

if (!fs.existsSync(deploymentsDir)) {
  throw new Error(
    `There are no deployments for network="${network}".\n` +
      `Expected: ${deploymentsDir}\n` +
      `Did you deploy with hardhat-deploy?`
  );
}

fs.mkdirSync(sdkGeneratedDir, { recursive: true });

// chainId (hardhat-deploy writes deployments/<network>/.chainId)
let chainId = 0;
const chainIdPath = path.join(deploymentsDir, ".chainId");
if (fs.existsSync(chainIdPath)) {
  const raw = fs.readFileSync(chainIdPath, "utf8").trim();
  const parsed = Number(raw);
  chainId = Number.isFinite(parsed) ? parsed : 0;
}

// -----------------------------------------------------------------------------
// 1) Read deployed contracts from hardhat-deploy deployments/<network>
// -----------------------------------------------------------------------------

const deploymentFiles = fs
  .readdirSync(deploymentsDir)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !f.startsWith("."));

const addresses: Record<string, `0x${string}`> = {};
const deployedAbis: Record<string, unknown> = {};

for (const file of deploymentFiles) {
  const fullPath = path.join(deploymentsDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const json = JSON.parse(raw) as DeploymentJson;

  const name = path.basename(file, ".json");

  if (!json.address || !isHexAddress(json.address)) continue;
  if (!json.abi) continue;

  addresses[name] = json.address;
  deployedAbis[name] = json.abi;
}

// -----------------------------------------------------------------------------
// 2) Read local contract ABIs from Hardhat artifacts (even if not deployed)
//    We scan only artifacts/contracts/** to avoid exporting build-info noise.
// -----------------------------------------------------------------------------

const artifactFiles = walkDir(artifactsContractsDir)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !f.endsWith(".dbg.json"));

const artifactAbis: Record<string, unknown> = {};
const artifactAbiSource: Record<string, string> = {};

for (const file of artifactFiles) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as ArtifactJson;

    // Hardhat artifact shape includes "contractName" + "abi"
    if (!isObject(parsed) || typeof parsed.contractName !== "string" || !("abi" in parsed)) {
      continue;
    }

    const contractName = parsed.contractName;
    const abi = parsed.abi;

    if (!abi) continue;

    // If the same contract name appears multiple times, prefer the first if ABI matches.
    // Warn only if there is an actual ABI conflict.
    if (artifactAbis[contractName] !== undefined) {
      if (!deepEqualJson(artifactAbis[contractName], abi)) {
        console.warn(
          `⚠️ ABI conflict for contract "${contractName}". Keeping first artifact from ` +
            `${artifactAbiSource[contractName]}, skipping ${file}`
        );
      }
      continue;
    }

    artifactAbis[contractName] = abi;
    artifactAbiSource[contractName] = path.relative(process.cwd(), file);
  } catch (err) {
    console.warn(`⚠️ Failed to parse artifact file: ${file}`, err);
  }
}

// -----------------------------------------------------------------------------
// 3) Merge ABIs: deployed ABIs first, then fill missing ones from artifacts
// -----------------------------------------------------------------------------

const abis: Record<string, unknown> = { ...deployedAbis };

for (const [name, abi] of Object.entries(artifactAbis)) {
  if (abis[name] === undefined) {
    abis[name] = abi;
  }
}

const deployedContractNames = Object.keys(addresses).sort();
const allAbiNames = Object.keys(abis).sort();
const abiOnlyContractNames = allAbiNames.filter((name) => !(name in addresses));

// Export deployed contracts as { address, abi }
const deployedContractExports = deployedContractNames
  .map((name) => {
    const safeName = safeTsIdentifier(name);
    return `export const ${safeName} = { address: addresses.${name}, abi: abis.${name} } as const;`;
  })
  .join("\n");

// Export ABI-only contracts as <Name>Abi
const abiOnlyExports = abiOnlyContractNames
  .map((name) => {
    const safeName = safeTsIdentifier(name);
    return `export const ${safeName}Abi = abis.${name};`;
  })
  .join("\n");

const ts = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Generated by packages/contracts/scripts/export-to-sdk.ts
   Network: ${network}
*/
import type { ContractAddresses } from "../types";

export const chainId = ${chainId} as const;

// Deployed contract addresses for this network
export const addresses = ${JSON.stringify(addresses, null, 2)} as const satisfies ContractAddresses;

// ABIs include:
// - deployed contracts (from hardhat-deploy deployments)
// - local contracts not yet deployed on this network (from Hardhat artifacts)
export const abis = ${JSON.stringify(abis, null, 2)} as const;

// Helpful contract name lists
export const deployedContractNames = ${JSON.stringify(deployedContractNames, null, 2)} as const;
export const abiOnlyContractNames = ${JSON.stringify(abiOnlyContractNames, null, 2)} as const;

${deployedContractExports}${deployedContractExports && abiOnlyExports ? "\n" : ""}${abiOnlyExports}
`;

fs.writeFileSync(outFile, ts, "utf8");

console.log(`✅ SDK generated: ${outFile}`);
console.log(`   Network: ${network} (chainId: ${chainId})`);
console.log(
  `   Deployed contracts (${deployedContractNames.length}): ${
    deployedContractNames.length ? deployedContractNames.join(", ") : "(none)"
  }`
);
console.log(
  `   ABI-only contracts (${abiOnlyContractNames.length}): ${
    abiOnlyContractNames.length ? abiOnlyContractNames.join(", ") : "(none)"
  }`
);