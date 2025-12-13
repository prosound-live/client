import { useState, useCallback } from "react";
import { useWriteContract, usePublicClient, useConfig } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { parseEther, http, zeroAddress, TransactionReceipt, Log } from "viem";
import { StoryClient, TokenIdInput } from "@story-protocol/core-sdk";
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  TEE_URI,
  RECORD_NFT_ADDRESS,
  MOCKERC20_ADDRESS, // This is actually WIP token
} from "@/lib/constants";

// ============== STORY PROTOCOL CONSTANTS (Aeneid Testnet) ==============

const STORY_RPC = "https://aeneid.storyrpc.io";
const ROYALTY_POLICY_LAP = "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E";

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
  | "minted" // New status: NFT minted, waiting for user to generate license
  | "registering-ip"
  | "attaching-license"
  | "notifying-tee"
  | "success"
  | "error";

export interface TEENotifyPayload {
  userAddress: string;
  encryptedCid: string;
  metadata: MusicMetadataForIPFS;
  ipId?: string;
  licenseTermsId?: string;
  tokenId?: string;
}

export interface UseMintRecordResult {
  status: MintStatus;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  metadataUrl: string | null;
  ipId: string | null;
  licenseTermsId: string | null;
  tokenId: string | null;
  mintRecord: (params: {
    userAddress: string;
    metadata: Omit<MusicMetadataForIPFS, "createdAt">;
    encryptedCid: string;
    pricePerMonth: string;
  }) => Promise<boolean>;
  generateLicense: () => Promise<boolean>;
  reset: () => void;
}

// ============== HELPER FUNCTIONS ==============

async function notifyTEE(payload: TEENotifyPayload): Promise<void> {
  console.log("TEE payload:", payload);
  const response = await fetch(`${TEE_URI}/api/v1/NFT/uploaddata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload metadata to IPFS");
  }

  return result;
}

function parseTokenIdFromReceipt(receipt: TransactionReceipt): bigint {
  // ERC721 Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
  const transferTopic =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  // RecordCreated event: RecordCreated(address indexed creator, uint256 indexed recordId, uint256 pricePerMonth)
  // keccak256("RecordCreated(address,uint256,uint256)")
  const recordCreatedTopic =
    "0x8b8c0a0e7c4e3a7a8b1e3e9f0c3a7d0e1f8a2b5c8e1d4a7b0c3f6e9a2d5b8c1e";

  console.log("📝 Parsing receipt logs. Total logs:", receipt.logs.length);
  console.log("📝 RECORD_NFT_ADDRESS:", RECORD_NFT_ADDRESS.toLowerCase());
  console.log("📝 FACTORY_ADDRESS:", FACTORY_ADDRESS.toLowerCase());

  // Debug: Log all events
  receipt.logs.forEach((log, i) => {
    console.log(`  Log ${i}: address=${log.address.toLowerCase()}, topic0=${log.topics[0]?.slice(0, 10)}..., topics length=${log.topics.length}`);
  });

  // Look for Transfer event from RECORD_NFT contract
  const transferLog = receipt.logs.find(
    (log: Log) =>
      log.topics[0]?.toLowerCase() === transferTopic.toLowerCase() &&
      log.address.toLowerCase() === RECORD_NFT_ADDRESS.toLowerCase()
  );

  if (transferLog && transferLog.topics[3]) {
    const tokenId = BigInt(transferLog.topics[3]);
    console.log("✅ Found token ID from RECORD_NFT Transfer event:", tokenId.toString());
    return tokenId;
  }

  // Fallback: Look for RecordCreated event from Factory contract
  // The recordId is in topics[2] (second indexed parameter)
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase() && log.topics.length >= 3) {
      // topics[0] = event signature
      // topics[1] = creator (indexed)
      // topics[2] = recordId (indexed)
      const tokenId = BigInt(log.topics[2]);
      console.log("✅ Found token ID from RecordCreated event:", tokenId.toString());
      return tokenId;
    }
  }

  // Last fallback: try any Transfer event with tokenId in topics[3]
  for (const log of receipt.logs) {
    if (
      log.topics[0]?.toLowerCase() === transferTopic.toLowerCase() &&
      log.topics[3]
    ) {
      const tokenId = BigInt(log.topics[3]);
      console.log("✅ Found token ID from fallback Transfer event:", tokenId.toString(), "from contract:", log.address);
      return tokenId;
    }
  }

  throw new Error("Could not find token ID in transaction receipt");
}

function createMetadataHash(data: string): `0x${string}` {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  let hash = 0;
  for (let i = 0; i < encoded.length; i++) {
    hash = (hash << 5) - hash + encoded[i];
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}` as `0x${string}`;
}

// ============== HOOK ==============

export function useMintRecord(): UseMintRecordResult {
  const [status, setStatus] = useState<MintStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ipId, setIpId] = useState<string | null>(null);
  const [licenseTermsId, setLicenseTermsId] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);

  // Store data needed for license generation
  const [pendingData, setPendingData] = useState<{
    userAddress: string;
    encryptedCid: string;
    metadata: MusicMetadataForIPFS;
    priceInWei: bigint;
    ipfsHash: string;
  } | null>(null);

  const publicClient = usePublicClient();
  const config = useConfig();
  const { writeContractAsync, reset: resetWrite } = useWriteContract();

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setMetadataUrl(null);
    setTxHash(null);
    setIpId(null);
    setLicenseTermsId(null);
    setTokenId(null);
    setPendingData(null);
    resetWrite();
  }, [resetWrite]);

  // Step 1: Upload metadata and mint NFT
  const mintRecord = useCallback(
    async (params: {
      userAddress: string;
      metadata: Omit<MusicMetadataForIPFS, "createdAt">;
      encryptedCid: string;
      pricePerMonth: string;
    }): Promise<boolean> => {
      const { userAddress, metadata, encryptedCid, pricePerMonth } = params;

      if (!publicClient) {
        setError("Public client not available");
        setStatus("error");
        return false;
      }

      setError(null);
      setMetadataUrl(null);
      setTxHash(null);
      setIpId(null);
      setLicenseTermsId(null);
      setTokenId(null);
      setPendingData(null);

      try {
        // ==================== STEP 1: Upload Metadata ====================
        setStatus("uploading-metadata");

        const fullMetadata: MusicMetadataForIPFS = {
          ...metadata,
          createdAt: new Date().toISOString(),
        };

        const pinataResult = await uploadMetadataToPinata(fullMetadata);
        setMetadataUrl(pinataResult.metadataUrl);

        console.log("✅ Step 1: Metadata uploaded:", pinataResult.metadataUrl);

        // ==================== STEP 2: Mint NFT ====================
        setStatus("waiting-approval");

        const priceInWei = parseEther(pricePerMonth);

        const hash = await writeContractAsync({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "mintRecord",
          args: [pinataResult.metadataUrl, encryptedCid, priceInWei],
        });

        setTxHash(hash);
        setStatus("confirming");

        console.log("✅ Step 2: Mint tx submitted:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Mint transaction failed");
        }

        const mintedTokenId = parseTokenIdFromReceipt(receipt);
        setTokenId(mintedTokenId.toString());

        console.log("✅ Step 2: NFT minted, Token ID:", mintedTokenId.toString());

        // Store data for license generation
        setPendingData({
          userAddress,
          encryptedCid,
          metadata: fullMetadata,
          priceInWei,
          ipfsHash: pinataResult.ipfsHash,
        });

        // Set status to minted - waiting for user to click "Generate License"
        setStatus("minted");
        console.log("📝 NFT minted. Click 'Generate License' to continue.");
        return true;
      } catch (err) {
        console.error("❌ Mint error:", err);
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        setStatus("error");
        return false;
      }
    },
    [writeContractAsync, publicClient]
  );

  // Step 2: Generate license (called by user after mint)
  const generateLicense = useCallback(async (): Promise<boolean> => {
    if (!pendingData || !tokenId || !metadataUrl) {
      setError("No pending mint data. Please mint first.");
      setStatus("error");
      return false;
    }

    try {
      // Get fresh wallet client using getWalletClient from @wagmi/core
      setStatus("registering-ip");
      console.log("🔄 Getting wallet client...");

      const walletClient = await getWalletClient(config);

      if (!walletClient) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }

      console.log("✅ Wallet client obtained:", walletClient.account.address);

      // Verify token exists before registering
      console.log("🔄 Verifying token ownership...");
      console.log("   NFT Contract:", RECORD_NFT_ADDRESS);
      console.log("   Token ID:", tokenId);

      // Create a public client to verify token ownership
      const { createPublicClient, http: viemHttp } = await import("viem");
      const verifyClient = createPublicClient({
        transport: viemHttp(STORY_RPC),
      });

      try {
        const owner = await verifyClient.readContract({
          address: RECORD_NFT_ADDRESS as `0x${string}`,
          abi: [
            {
              name: "ownerOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ type: "address" }],
            },
          ],
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        });
        console.log("✅ Token owner verified:", owner);

        if (owner.toLowerCase() !== walletClient.account.address.toLowerCase()) {
          throw new Error(`Token ${tokenId} is not owned by ${walletClient.account.address}. Owner is ${owner}`);
        }
      } catch (verifyError) {
        console.error("❌ Token verification failed:", verifyError);
        throw new Error(`Token ${tokenId} does not exist on contract ${RECORD_NFT_ADDRESS}. The NFT may have been minted to a different contract.`);
      }

      // ==================== STEP 3: Register IP on Story Protocol ====================
      const storyClient = StoryClient.newClient({
        chainId: "aeneid",
        transport: http(STORY_RPC),
        wallet: walletClient,
      });

      console.log("🔄 Step 3: Registering IP Asset...");

      const registerResponse = await storyClient.ipAsset.register({
        nftContract: RECORD_NFT_ADDRESS as `0x${string}`,
        tokenId: BigInt(tokenId) as TokenIdInput,
        ipMetadata: {
          ipMetadataURI: metadataUrl,
          ipMetadataHash: createMetadataHash(metadataUrl),
          nftMetadataURI: metadataUrl,
          nftMetadataHash: createMetadataHash(pendingData.ipfsHash),
        },
        txOptions: { confirmations: 1 },
      });

      console.log("🔄 Step 3: Register response:", registerResponse);

      const registeredIpId = registerResponse.ipId;
      setIpId(registeredIpId || null);

      if (!registeredIpId) {
        throw new Error("Failed to register IP Asset");
      }

      console.log("✅ Step 3: IP registered:", registeredIpId);

      // ==================== STEP 4: Attach License Terms ====================
      setStatus("attaching-license");

      console.log("🔄 Step 4: Attaching license terms...");

      const licenseResponse =
        await storyClient.license.registerPilTermsAndAttach({
          ipId: registeredIpId,
          licenseTermsData: [
            {
              terms: {
                transferable: true,
                royaltyPolicy: ROYALTY_POLICY_LAP as `0x${string}`,
                defaultMintingFee: pendingData.priceInWei,
                expiration: BigInt(0),
                commercialUse: true,
                commercialAttribution: true,
                commercializerChecker: zeroAddress,
                commercializerCheckerData: "0x" as `0x${string}`,
                commercialRevShare: 0,
                commercialRevCeiling: BigInt(0),
                derivativesAllowed: false,
                derivativesAttribution: false,
                derivativesApproval: false,
                derivativesReciprocal: false,
                derivativeRevCeiling: BigInt(0),
                currency: MOCKERC20_ADDRESS as `0x${string}`, // WIP token
                uri: metadataUrl,
              },
            },
          ],
          txOptions: { confirmations: 1 },
        });

      const newLicenseTermsId =
        licenseResponse.licenseTermsIds?.[0]?.toString();
      setLicenseTermsId(newLicenseTermsId || null);

      console.log("✅ Step 4: License attached, Terms ID:", newLicenseTermsId);

      // ==================== STEP 5: Notify TEE ====================
      setStatus("notifying-tee");

      console.log("🔄 Step 5: Notifying TEE...");

      await notifyTEE({
        userAddress: pendingData.userAddress,
        encryptedCid: pendingData.encryptedCid,
        metadata: pendingData.metadata,
        ipId: registeredIpId,
        licenseTermsId: newLicenseTermsId,
        tokenId: tokenId,
      });

      console.log("✅ Step 5: TEE notified");

      setStatus("success");
      setPendingData(null);
      console.log("🎉 All steps completed successfully!");
      return true;
    } catch (err) {
      console.error("❌ License generation error:", err);
      const message = err instanceof Error ? err.message : "License generation failed";
      setError(message);
      setStatus("error");
      return false;
    }
  }, [config, pendingData, tokenId, metadataUrl]);

  const isLoading = [
    "uploading-metadata",
    "waiting-approval",
    "minting",
    "confirming",
    "registering-ip",
    "attaching-license",
    "notifying-tee",
  ].includes(status);

  return {
    status,
    isLoading,
    error,
    txHash,
    metadataUrl,
    ipId,
    licenseTermsId,
    tokenId,
    mintRecord,
    generateLicense,
    reset,
  };
}

export default useMintRecord;
