import { useState, useCallback } from "react";
import { encryptMusicFile, EncryptionResult } from "@/lib/encryption";
import { TEE_URI } from "@/lib/constants";

// ============== TYPES ==============

export interface EncryptedKeyData {
  iv: string;
  ephemPublicKey: string;
  ciphertext: string;
  mac: string;
}

export interface FileData {
  fileName: string;
  fileType: string;
  iv: string;
  encryptedKey: EncryptedKeyData;
}

export interface UploadPayload {
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
  fileData: FileData;
}

export interface UploadResponse {
  status: number;
  payload: UploadPayload;
  message: string;
  success: boolean;
}

export type UploadStatus = "idle" | "fetching-key" | "encrypting" | "uploading" | "success" | "error";

export interface UseMusicUploadResult {
  /** Current upload status */
  status: UploadStatus;
  /** Whether an upload operation is in progress */
  isLoading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** TEE public key (fetched on first upload) */
  publicKey: string | null;
  /** Upload response data on success */
  uploadData: UploadResponse | null;
  /** Progress percentage (0-100) for current step */
  progress: number;
  /** Upload a music file - handles encryption and upload to TEE */
  uploadMusic: (file: File) => Promise<UploadResponse | null>;
  /** Fetch TEE public key manually (optional - uploadMusic fetches if needed) */
  fetchPublicKey: () => Promise<string | null>;
  /** Reset the hook state */
  reset: () => void;
}

// ============== HELPER FUNCTIONS ==============

async function fetchTEEPublicKey(): Promise<string> {
  const response = await fetch(`${TEE_URI}/api/v1/hash/getpublickey`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public key: ${response.status}`);
  }

  const json = await response.json();
  const publicKey = json.payload?.publicKey ?? json;

  if (!publicKey || typeof publicKey !== "string") {
    throw new Error("Invalid public key response");
  }

  return publicKey;
}

async function uploadEncryptedFile(fileData: EncryptionResult): Promise<UploadResponse> {
  const { encryptedFile, iv, encryptedKey, fileName, fileType } = fileData;

  const formData = new FormData();
  formData.append("encryptedFile", encryptedFile, fileName);
  formData.append("iv", iv);
  formData.append("encryptedKey", JSON.stringify(encryptedKey));
  formData.append("fileName", fileName);
  formData.append("fileType", fileType);

  const response = await fetch(`${TEE_URI}/api/v1/pinata/upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Upload failed");
  }

  return result as UploadResponse;
}

// ============== HOOK ==============

export function useMusicUpload(): UseMusicUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setUploadData(null);
    setProgress(0);
  }, []);

  const fetchPublicKey = useCallback(async (): Promise<string | null> => {
    // Return cached key if available
    if (publicKey) return publicKey;

    setStatus("fetching-key");
    setError(null);
    setProgress(10);

    try {
      const key = await fetchTEEPublicKey();
      setPublicKey(key);
      setProgress(20);
      return key;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch public key";
      setError(message);
      setStatus("error");
      return null;
    }
  }, [publicKey]);

  const uploadMusic = useCallback(async (file: File): Promise<UploadResponse | null> => {
    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file");
      setStatus("error");
      return null;
    }

    setError(null);
    setUploadData(null);
    setProgress(0);

    try {
      // Step 1: Fetch public key if not cached
      let key = publicKey;
      if (!key) {
        setStatus("fetching-key");
        setProgress(10);
        key = await fetchTEEPublicKey();
        setPublicKey(key);
      }
      setProgress(20);

      // Step 2: Encrypt the file
      setStatus("encrypting");
      setProgress(30);
      const encryptionResult = await encryptMusicFile(file, key);
      setProgress(50);

      // Step 3: Upload to TEE
      setStatus("uploading");
      setProgress(60);
      const result = await uploadEncryptedFile(encryptionResult);
      setProgress(100);

      // Success
      setUploadData(result);
      setStatus("success");
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setStatus("error");
      return null;
    }
  }, [publicKey]);

  const isLoading = status === "fetching-key" || status === "encrypting" || status === "uploading";

  return {
    status,
    isLoading,
    error,
    publicKey,
    uploadData,
    progress,
    uploadMusic,
    fetchPublicKey,
    reset,
  };
}

export default useMusicUpload;
