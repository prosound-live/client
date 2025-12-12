import { TEE_URI } from "./constants";

/**
 * Fetch and decrypt file from Pinata IPFS
 * @param {Object} params - Decryption parameters
 * @param {string} params.cid - IPFS CID/hash
 * @param {string} params.iv - Initialization vector
 * @param {Object|string} params.encryptedKey - Encrypted AES key (object or JSON string)
 * @param {string} [params.fileName] - Original file name
 * @param {string} [params.fileType] - MIME type (e.g., "audio/mpeg")
 * @param {Object} [options] - Additional options
 * @param {Function} [options.onProgress] - Progress callback (bytesReceived, totalBytes)
 * @param {string} [options.baseUrl] - API base URL (default: TEE_URI)
 * @returns {Promise<Blob>} - Decrypted file as Blob
 */
export async function getAndDecryptFile(
  params: {
    cid: string;
    iv: string;
    encryptedKey: object | string;
    fileName?: string;
    fileType?: string;
  },
  options: {
    onProgress?: (bytesReceived: number, totalBytes: number | null) => void;
    baseUrl?: string;
  } = {}
): Promise<Blob> {
  const { cid, iv, encryptedKey, fileName, fileType } = params;
  const { onProgress, baseUrl = TEE_URI } = options;

  if (!cid || !iv || !encryptedKey) {
    throw new Error("Missing required parameters: cid, iv, encryptedKey");
  }

  // Prepare query parameters
  const queryParams = new URLSearchParams({
    cid,
    iv,
    encryptedKey:
      typeof encryptedKey === "string"
        ? encryptedKey
        : JSON.stringify(encryptedKey),
  });

  if (fileName) queryParams.append("fileName", fileName);
  if (fileType) queryParams.append("fileType", fileType);

  const url = `${baseUrl}/api/v1/pinata/decrypt?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "POST",
    //   body: JSON.stringify({ cid }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    // Get content length if available
    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

    // Read response as stream
    const reader = response.body!.getReader();
    const chunks: BlobPart[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      // Call progress callback if provided
      if (onProgress && totalBytes) {
        onProgress(receivedBytes, totalBytes);
      }
    }

    // Combine all chunks into a single Blob
    const blob = new Blob(chunks, {
      type: fileType || "application/octet-stream",
    });

    return blob;
  } catch (error) {
    console.error("Error fetching and decrypting file:", error);
    throw error;
  }
}

/**
 * Download decrypted file
 */
export async function downloadDecryptedFile(
  cid: string,
  iv: string,
  encryptedKey: object | string,
  fileName?: string,
  fileType?: string
): Promise<void> {
  try {
    const blob = await getAndDecryptFile({
      cid,
      iv,
      encryptedKey,
      fileName,
      fileType,
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || `decrypted-${cid}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("File downloaded successfully");
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

/**
 * Play audio file directly
 */
export async function playDecryptedAudio(
  cid: string,
  iv: string,
  encryptedKey: object | string,
  onProgress?: (received: number, total: number | null) => void
): Promise<HTMLAudioElement> {
  try {
    const blob = await getAndDecryptFile(
      {
        cid,
        iv,
        encryptedKey,
        fileType: "audio/mpeg",
      },
      {
        onProgress:
          onProgress ||
          ((received, total) => {
            const percent = total ? ((received / total) * 100).toFixed(2) : "?";
            console.log(`Loading: ${percent}%`);
          }),
      }
    );

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    // Clean up URL when audio ends
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(audioUrl);
    });

    return audio;
  } catch (error) {
    console.error("Playback failed:", error);
    throw error;
  }
}

/**
 * Display image
 */
export async function displayDecryptedImage(
  cid: string,
  iv: string,
  encryptedKey: object | string,
  imageElement: HTMLImageElement
): Promise<void> {
  try {
    const blob = await getAndDecryptFile({
      cid,
      iv,
      encryptedKey,
      fileType: "image/jpeg",
    });

    const imageUrl = URL.createObjectURL(blob);
    imageElement.src = imageUrl;

    // Clean up URL when image loads
    imageElement.onload = () => {
      URL.revokeObjectURL(imageUrl);
    };
  } catch (error) {
    console.error("Image display failed:", error);
    throw error;
  }
}

/**
 * Stream to video element
 */
export async function streamDecryptedVideo(
  cid: string,
  iv: string,
  encryptedKey: object | string,
  videoElement: HTMLVideoElement,
  onProgress?: (received: number, total: number | null) => void
): Promise<void> {
  try {
    const blob = await getAndDecryptFile(
      {
        cid,
        iv,
        encryptedKey,
        fileType: "video/mp4",
      },
      {
        onProgress:
          onProgress ||
          ((received, total) => {
            const percent = total ? ((received / total) * 100).toFixed(2) : "?";
            console.log(`Buffering: ${percent}%`);
          }),
      }
    );

    const videoUrl = URL.createObjectURL(blob);
    videoElement.src = videoUrl;

    // Clean up URL when video ends
    videoElement.addEventListener("ended", () => {
      URL.revokeObjectURL(videoUrl);
    });
  } catch (error) {
    console.error("Video streaming failed:", error);
    throw error;
  }
}
