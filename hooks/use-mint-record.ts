import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, TEE_URI } from "@/lib/constants";

// ============== TYPES ==============

export interface MusicMetadataForIPFS {
  title: string;
  artist: string;
  genre: string;
  description: string;
  pricePerMonth: string;
  image: string;
  encryptedMusicCid: string;
  createdAt: string;
}

export interface PinataUploadResponse {
  success: boolean;
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
  metadataUrl: string;
}

export type MintStatus =
  | "idle"
  | "uploading-metadata"
  | "waiting-approval"
  | "minting"
  | "confirming"
  | "notifying-tee"
  | "success"
  | "error";

export interface TEENotifyPayload {
  userAddress: string;
  encryptedCid: string;
  metadata: MusicMetadataForIPFS;
}

export interface UseMintRecordResult {
  /** Current mint status */
  status: MintStatus;
  /** Whether a mint operation is in progress */
  isLoading: boolean;
  /** Error message if mint failed */
  error: string | null;
  /** Transaction hash */
  txHash: string | null;
  /** Metadata IPFS URL */
  metadataUrl: string | null;
  /** Mint a new record NFT */
  mintRecord: (params: {
    userAddress: string;
    metadata: Omit<MusicMetadataForIPFS, "createdAt">;
    encryptedCid: string;
    pricePerMonth: string;
  }) => Promise<boolean>;
  /** Reset the hook state */
  reset: () => void;
}

// ============== HELPER FUNCTIONS ==============

async function notifyTEE(payload: TEENotifyPayload): Promise<void> {
  console.log('payload', payload)
  const response = await fetch(`${TEE_URI}/api/v1/record/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "Failed to notify TEE");
  }
}

async function uploadMetadataToPinata(
  metadata: MusicMetadataForIPFS
): Promise<PinataUploadResponse> {
  const response = await fetch("/api/pinata/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metadata }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload metadata to IPFS");
  }

  return result;
}

// ============== HOOK ==============

export function useMintRecord(): UseMintRecordResult {
  const [status, setStatus] = useState<MintStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const { writeContractAsync, reset: resetWrite } = useWriteContract();

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setMetadataUrl(null);
    setTxHash(null);
    resetWrite();
  }, [resetWrite]);

  const mintRecord = useCallback(
    async (params: {
      userAddress: string;
      metadata: Omit<MusicMetadataForIPFS, "createdAt">;
      encryptedCid: string;
      pricePerMonth: string;
    }): Promise<boolean> => {
      const { userAddress, metadata, encryptedCid, pricePerMonth } = params;

      setError(null);
      setMetadataUrl(null);
      setTxHash(null);

      try {
        // Step 1: Upload metadata to IPFS via Pinata
        setStatus("uploading-metadata");

        const fullMetadata: MusicMetadataForIPFS = {
          ...metadata,
          createdAt: new Date().toISOString(),
        };

        const pinataResult = await uploadMetadataToPinata(fullMetadata);
        setMetadataUrl(pinataResult.metadataUrl);

        // Step 2: Call mintRecord on the factory contract
        setStatus("waiting-approval");

        // Convert price to wei
        const priceInWei = parseEther(pricePerMonth);

        // Use writeContractAsync to get the transaction hash
        const hash = await writeContractAsync({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "mintRecord",
          args: [pinataResult.metadataUrl, encryptedCid, priceInWei],
        });

        setTxHash(hash);
        setStatus("confirming");

        // Step 3: Wait for transaction receipt
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });

        // Check if transaction was successful
        if (receipt.status === "success") {
          // Step 4: Notify TEE with user address, encrypted CID, and all metadata
          setStatus("notifying-tee");

          await notifyTEE({
            userAddress,
            encryptedCid,
            metadata: fullMetadata,
          });

          setStatus("success");
          return true;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        setStatus("error");
        return false;
      }
    },
    [writeContractAsync, publicClient]
  );

  const isLoading =
    status === "uploading-metadata" ||
    status === "waiting-approval" ||
    status === "minting" ||
    status === "confirming" ||
    status === "notifying-tee";

  return {
    status,
    isLoading,
    error,
    txHash,
    metadataUrl,
    mintRecord,
    reset,
  };
}

export default useMintRecord;
