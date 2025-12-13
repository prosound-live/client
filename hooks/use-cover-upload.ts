import { useState, useCallback } from "react";

// ============== TYPES ==============

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  original_filename: string;
}

export type CoverUploadStatus = "idle" | "uploading" | "success" | "error";

export interface UseCoverUploadResult {
  /** Current upload status */
  status: CoverUploadStatus;
  /** Whether an upload operation is in progress */
  isLoading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** Cloudinary secure URL of uploaded image */
  imageUrl: string | null;
  /** Full Cloudinary response */
  uploadData: CloudinaryUploadResponse | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Upload a cover image to Cloudinary */
  uploadCover: (file: File) => Promise<CloudinaryUploadResponse | null>;
  /** Reset the hook state */
  reset: () => void;
}

// ============== CONSTANTS ==============

// Cloudinary unsigned upload configuration
// In production, move these to environment variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  throw new Error("Cloudinary environment variables are not set");
}

// ============== HELPER FUNCTIONS ==============

async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET as string);
  formData.append("folder", "music-covers");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response as CloudinaryUploadResponse);
        } catch {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || "Upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(formData);
  });
}

// ============== HOOK ==============

export function useCoverUpload(): UseCoverUploadResult {
  const [status, setStatus] = useState<CoverUploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<CloudinaryUploadResponse | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setImageUrl(null);
    setUploadData(null);
    setProgress(0);
  }, []);

  const uploadCover = useCallback(async (file: File): Promise<CloudinaryUploadResponse | null> => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      setStatus("error");
      return null;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be less than 10MB");
      setStatus("error");
      return null;
    }

    setError(null);
    setUploadData(null);
    setImageUrl(null);
    setProgress(0);
    setStatus("uploading");

    try {
      const result = await uploadToCloudinary(file, setProgress);

      setUploadData(result);
      setImageUrl(result.secure_url);
      setStatus("success");
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const isLoading = status === "uploading";

  return {
    status,
    isLoading,
    error,
    imageUrl,
    uploadData,
    progress,
    uploadCover,
    reset,
  };
}

export default useCoverUpload;
