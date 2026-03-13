import type { Address, Hex, WalletClient } from "viem";
import { pad, toHex, bytesToHex, isHex } from "viem";

let _instancePromise: Promise<any> | null = null;

// Handle normalization: the SDK can return handles in various formats (hex string, Uint8Array, Buffer, etc.) 
// We need to ensure it's always a bytes32 hex string to interact with the contract.
export function handleToHex32(handle: unknown): Hex {
  // already hex string
  if (typeof handle === "string") {
    const h = handle as Hex;
    if (!isHex(h)) throw new Error("handle string is not hex");
    // ensure 32 bytes
    return pad(h, { size: 32 });
  }

  // bigint / number
  if (typeof handle === "bigint") return pad(toHex(handle), { size: 32 });
  if (typeof handle === "number") return pad(toHex(BigInt(handle)), { size: 32 });

  // Uint8Array / Buffer
  if (handle instanceof Uint8Array) {
    return pad(bytesToHex(handle), { size: 32 });
  }

  // ArrayBuffer
  if (handle instanceof ArrayBuffer) {
    return pad(bytesToHex(new Uint8Array(handle)), { size: 32 });
  }

  // Some SDKs return { data: Uint8Array } or similar
  if (handle && typeof handle === "object") {
    const anyH = handle as any;

    // common patterns
    if (anyH.data instanceof Uint8Array) {
      return pad(bytesToHex(anyH.data), { size: 32 });
    }
    if (typeof anyH.hex === "string") {
      return pad(anyH.hex as Hex, { size: 32 });
    }
    if (typeof anyH.value === "string") {
      return pad(anyH.value as Hex, { size: 32 });
    }
    if (typeof anyH.toString === "function") {
      const s = anyH.toString();
      if (typeof s === "string" && s.startsWith("0x")) {
        return pad(s as Hex, { size: 32 });
      }
    }
  }

  throw new Error(`Unsupported handle type: ${typeof handle}`);
}

/**
 * Get the singleton instance of the FHE Relayer SDK for the given chainId. 
 * Currently hardcoded to Sepolia, since that's the only network where the relayer is deployed. 
 * If you want to use it with another network, you'll need to deploy your own instance of the relayer and update this function accordingly.
 * @param chainId The chainId of the network to get the FHE Relayer SDK instance for. Must be 11155111 (Sepolia) with the current implementation.
 * @returns The FHE Relayer SDK instance for the given chainId.
 * @throws If the chainId is not supported or if there was an error initializing the SDK.
 */
export async function getFhevmInstance(chainId: number) {
  if (typeof window === "undefined") {
    throw new Error("getFhevmInstance can only be used in the browser.");
  }
  if (chainId !== 11155111) {
    throw new Error("FHE Relayer SDK is configured for Sepolia (11155111). Switch network to Sepolia.");
  }

  if (!_instancePromise) {
    _instancePromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/bundle");

      if (typeof initSDK !== "function") {
        throw new Error("Relayer SDK initSDK missing. Do not import @zama-fhe/relayer-sdk/bundle unless you load the CDN script.");
      }

      await initSDK();

      const cfg = { ...SepoliaConfig, network: (window as any).ethereum };
      return createInstance(cfg);
    })();
  }

  return _instancePromise;
}

/**
 * Encrypt a uint64 value for a given user and contract, returning the ciphertext handle and input proof. 
 * The handle can be used by the contract to retrieve the encrypted value, and the input proof can be used to verify that the encryption was done correctly.
 * @param chainId The chainId of the network where the contract is deployed. Must be 11155111 (Sepolia) with the current implementation.
 * @param contractAddress The address of the contract for which to encrypt the value.
 * @param userAddress The address of the user for which to encrypt the value. This should be the same as the connected wallet address.
 * @param value The uint64 value to encrypt.
 * @returns The ciphertext handle and input proof for the encrypted value, which can be used by the contract to retrieve and verify the encrypted value.
 * @throws If the chainId is not supported, if there was an error initializing the SDK, or if the encryption process fails.
 */
export async function encryptUint64(params: {
  chainId: number;
  contractAddress: Address;
  userAddress: Address;
  value: bigint;
}): Promise<{ handle: Hex; inputProof: Hex }> {
  const instance = await getFhevmInstance(params.chainId);

  const buffer = instance.createEncryptedInput(params.contractAddress, params.userAddress);
  buffer.add64(params.value);

  const ciphertexts = await buffer.encrypt(); // { handles, inputProof } :contentReference[oaicite:2]{index=2}

  // Normalize to bytes32 hex
  const rawHandle = ciphertexts.handles?.[0];
  if (rawHandle === undefined) throw new Error("encrypt() did not return handles[0]");
  const handle = handleToHex32(rawHandle);

  // inputProof can come as a string or uint8array, normalize to hex string
  const rawProof = ciphertexts.inputProof;
  let inputProof: Hex;

  if (typeof rawProof === "string") {
    inputProof = rawProof as Hex;
  } else if (rawProof instanceof Uint8Array) {
    inputProof = bytesToHex(rawProof) as Hex;
  } else {
    // fallback: intenta convertir lo que sea a hex
    inputProof = toHex(rawProof as any) as Hex;
  }

  if (!isHex(handle)) throw new Error(`Invalid handle hex: ${String(handle)}`);
  if (!isHex(inputProof)) throw new Error(`Invalid inputProof hex: ${String(inputProof)}`);

  return { handle, inputProof };
}

/**
 * Decrypts an encrypted uint64 value for a given user and contract.
 * The user must sign a message to authorize the decryption, and the relayer will verify the signature before returning the decrypted value.
 * @param chainId The chainId of the network where the contract is deployed. Must be 11155111 (Sepolia) with the current implementation.
 * @param walletClient The connected wallet client, used to get the user's address and sign the decryption authorization message.
 * @param contractAddress The address of the contract for which to decrypt the value.
 * @param handle The ciphertext handle returned by the encryptUint64 function when the value was encrypted.
 * @returns The decrypted uint64 value.
 */
export async function userDecryptUint64(params: {
  chainId: number;
  walletClient: WalletClient;
  contractAddress: Address;
  handle: Hex;
}): Promise<bigint> {
  const instance = await getFhevmInstance(params.chainId);

  if (!params.walletClient.account) throw new Error("Wallet not connected");

  const keypair = instance.generateKeypair();

  const handleContractPairs = [{ handle: params.handle, contractAddress: params.contractAddress }];

  const startTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const durationDays = 10n;
  const contractAddresses = [params.contractAddress];

  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, Number(startTimestamp), Number(durationDays));

  const typedMessage = {
    publicKey: eip712.message.publicKey,
    contractAddresses: eip712.message.contractAddresses as readonly Address[],
    startTimestamp,
    durationDays,
    extraData: eip712.message.extraData,
  } as const;

  const signature = await params.walletClient.signTypedData({
    account: params.walletClient.account,
    domain: {
      ...eip712.domain,
      verifyingContract: eip712.domain.verifyingContract as Address,
    },
    types: {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    primaryType: "UserDecryptRequestVerification",
    message: typedMessage,
  });

  const signatureHex = typeof signature === 'string' ? signature : String(signature);

  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signatureHex.replace("0x", ""),
    contractAddresses,
    params.walletClient.account.address,
    Number(startTimestamp),
    Number(durationDays),
  );

  const v = result[params.handle];
  if (v === undefined || v === null) throw new Error("userDecrypt result missing handle");

  return BigInt(v);
}
