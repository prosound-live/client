import EthCrypto, { Encrypted } from "eth-crypto";

// ============== TYPES ==============

export interface EncryptionResult {
  encryptedFile: Blob;
  iv: string;
  encryptedKey: Encrypted;
  fileName: string;
  fileType: string;
}

export interface Metadata {
  iv: string;
  encryptedKey: Encrypted;
  fileCID: string;
  fileName: string;
  fileType: string;
}

// ============== ENCRYPTION ==============

export async function encryptMusicFile(
  file: File,
  receiverPublicKey: string
): Promise<EncryptionResult> {
  // 1. Generate random AES key (256-bit)
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  // 2. Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // 4. Encrypt file with AES-GCM
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );

  // 5. Export AES key as raw bytes, then hex string
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  const keyHex = bufferToHex(rawKey);

  // 6. Encrypt the AES key with receiver's public key (ECIES)
  const encryptedKey = await EthCrypto.encryptWithPublicKey(
    receiverPublicKey,
    keyHex
  );

  return {
    encryptedFile: new Blob([encryptedBuffer], { type: "application/octet-stream" }),
    iv: bufferToHex(iv),
    encryptedKey,
    fileName: file.name,
    fileType: file.type,
  };
}

// ============== HELPERS ==============

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

