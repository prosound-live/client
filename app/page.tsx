'use client'

import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { encryptMusicFile, EncryptionResult } from "@/lib/encryption";
import { getAndDecryptFile } from "@/lib/decryption";
import { TEE_URI } from "@/lib/constants";

async function uploadEncryptedFile(fileData: EncryptionResult) {
  const {
    encryptedFile,
    iv,
    encryptedKey,
    fileName,
    fileType,
  } = fileData;

  // Create FormData object
  const formData = new FormData();

  // Append the encrypted file blob
  formData.append('encryptedFile', encryptedFile, fileName);

  // Append other form fields
  formData.append('iv', iv);
  formData.append('encryptedKey', JSON.stringify(encryptedKey));
  formData.append('fileName', fileName);
  formData.append('fileType', fileType);

  try {
    const response = await fetch(`${TEE_URI}/api/v1/pinata/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Upload failed');
    }

    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

interface UploadResponse {
  status: number;
  payload: {
    ipfsHash: string;
    pinSize: number;
    timestamp: string;
    fileData: {
      fileName: string;
      fileType: string;
      iv: string;
      encryptedKey: {
        iv: string;
        ephemPublicKey: string;
        ciphertext: string;
        mac: string;
      };
    };
  };
  message: string;
  success: boolean;
}

async function fetchFromIPFS(cid: string) {
  try {
    // Try IPFS gateway
    const ipfsGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(ipfsGatewayUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log("Fetched from IPFS:", {
      cid,
      size: blob.size,
      type: blob.type,
      blob,
    });

    return blob;
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    throw error;
  }
}

const Page = () => {
  const [encrypting, setEncrypting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fetchingIPFS, setFetchingIPFS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: publicKey, isLoading, error, refetch } = useQuery({
    queryKey: ["public-key"],
    queryFn: async () => {
      const res = await fetch(
        `${TEE_URI}/api/v1/hash/getpublickey`,
        {
          method: "POST",
        }
      );
      // Try JSON first, fall back to text
      try {
        const json = await res.json();
        console.log("Public key:", json);
        return json.payload.publicKey ?? json;
      } catch {
        return res.text();
      }
    },
    enabled: false, // Don't fetch automatically
  });

  const handleGetPublicKey = () => {
    refetch();
  };

  const handleFetchFromIPFS = async (cid: string) => {
    setFetchingIPFS(true);
    try {
      const blob = await fetchFromIPFS(cid);
      console.log("Received file from IPFS:", {
        cid,
        size: blob.size,
        type: blob.type,
        blob,
      });
      setEncryptionResult(`Fetched from IPFS: ${cid} (${blob.size} bytes, type: ${blob.type})`);
    } catch (err) {
      setEncryptionResult(`Error fetching from IPFS: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("Error fetching from IPFS:", err);
    } finally {
      setFetchingIPFS(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!publicKey) {
      alert("Please get public key first");
      return;
    }

    setEncrypting(true);
    setEncryptionResult(null);

    try {
      // Encrypt the file
      const result = await encryptMusicFile(file, publicKey);
      console.log("Encryption result:", result);
      setEncryptionResult(`File encrypted: ${result.fileName} (${result.encryptedFile.size} bytes)`);

      // Upload the encrypted file
      setUploading(true);
      const uploadResult = await uploadEncryptedFile(result);
      setUploadData(uploadResult);
      setEncryptionResult(
        `File encrypted and uploaded! IPFS Hash: ${uploadResult.payload?.ipfsHash || 'N/A'}`
      );
      console.log("Upload result:", uploadResult);
    } catch (err) {
      setEncryptionResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error("Error:", err);
    } finally {
      setEncrypting(false);
      setUploading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGetPublicKey}>Get Public Key</button>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {publicKey && <div>Public Key: {publicKey}</div>}

      <div>
        <button
          onClick={() => handleFetchFromIPFS("bafybeib5gnqfhao5ym7tmrcdl54kiimt5y5xmma5fmjl5wcehrlqopb5hy")}
          disabled={fetchingIPFS}
        >
          {fetchingIPFS ? "Fetching from IPFS..." : "Fetch from IPFS"}
        </button>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={encrypting || uploading}
        />
        <button
          disabled={encrypting || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {encrypting ? "Encrypting..." : uploading ? "Uploading..." : "Upload & Encrypt File"}
        </button>
      </div>

      {encryptionResult && <div>{encryptionResult}</div>}

      {uploadData && (
        <div>
          <div>File: {uploadData.payload.fileData.fileName}</div>
          <div>IPFS Hash: {uploadData.payload.ipfsHash}</div>
          <button
            onClick={async () => {
              if (audioRef.current) {
                if (playing) {
                  audioRef.current.pause();
                  setPlaying(false);
                } else {
                  audioRef.current.play();
                  setPlaying(true);
                }
                return;
              }

              if (!audioUrl) {
                setLoadingAudio(true);
                try {
                  const blob = await getAndDecryptFile(
                    {
                      cid: uploadData.payload.ipfsHash,
                      iv: uploadData.payload.fileData.iv,
                      encryptedKey: uploadData.payload.fileData.encryptedKey,
                      fileName: uploadData.payload.fileData.fileName,
                      fileType: uploadData.payload.fileData.fileType,
                    },
                    {
                      onProgress: (received, total) => {
                        if (total) {
                          setAudioProgress((received / total) * 100);
                        }
                      },
                    }
                  );

                  const url = URL.createObjectURL(blob);
                  setAudioUrl(url);
                  setLoadingAudio(false);

                  // Wait for audio element to be ready
                  setTimeout(() => {
                    if (audioRef.current) {
                      audioRef.current.play();
                      setPlaying(true);
                    }
                  }, 100);
                } catch (err) {
                  setLoadingAudio(false);
                  setEncryptionResult(`Playback error: ${err instanceof Error ? err.message : "Unknown error"}`);
                  console.error("Playback error:", err);
                }
              }
            }}
            disabled={loadingAudio}
          >
            {loadingAudio
              ? `Loading... ${audioProgress.toFixed(1)}%`
              : playing
                ? "Pause"
                : "Play Song"}
          </button>
          {audioUrl && (
            <div>
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                  setPlaying(false);
                  URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;