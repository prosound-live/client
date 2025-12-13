"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Image as ImageIcon,
    Loader2,
    Music,
    Upload,
    X,
} from "lucide-react"
import { useAccount } from "wagmi"
import { useMusicUpload, type UploadResponse } from "@/hooks/use-music-upload"
import { useCoverUpload } from "@/hooks/use-cover-upload"
import { useMintRecord } from "@/hooks/use-mint-record"

import {
    FamilyDrawerAnimatedContent,
    FamilyDrawerAnimatedWrapper,
    FamilyDrawerButton,
    FamilyDrawerClose,
    FamilyDrawerContent,
    FamilyDrawerHeader,
    FamilyDrawerOverlay,
    FamilyDrawerPortal,
    FamilyDrawerRoot,
    FamilyDrawerSecondaryButton,
    FamilyDrawerTrigger,
    FamilyDrawerViewContent,
    useFamilyDrawer,
    type ViewsRegistry,
} from "@/components/ui/family-drawer"
import Image from "next/image"

// Types
interface MusicFile {
    file: File
    name: string
    size: number
    duration?: string
}

interface CoverImage {
    file: File
    preview: string
}

interface MusicMetadata {
    title: string
    artist: string
    genre: string
    description: string
    pricePerMonth: string
}

// Global state for sharing between views (in production, use context or state management)
let uploadState = {
    musicFile: null as MusicFile | null,
    coverImage: null as CoverImage | null,
    coverImageUrl: null as string | null,
    metadata: {
        title: "",
        artist: "",
        genre: "",
        description: "",
        pricePerMonth: "",
    } as MusicMetadata,
    teeUploadResponse: null as UploadResponse | null,
}

// Reset state when starting new upload
function resetUploadState() {
    uploadState = {
        musicFile: null,
        coverImage: null,
        coverImageUrl: null,
        metadata: { title: "", artist: "", genre: "", description: "", pricePerMonth: "" },
        teeUploadResponse: null,
    }
}

// ============================================================================
// Step 1: Upload Music
// ============================================================================

function UploadMusicView() {
    const { setView } = useFamilyDrawer()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [musicFile, setMusicFile] = useState<MusicFile | null>(null)

    // TEE upload hook
    const {
        uploadMusic,
        isLoading: isUploading,
        error: uploadError,
        status: uploadStatus,
        progress: uploadProgress,
        reset: resetUpload
    } = useMusicUpload()

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("audio/")) {
            alert("Please upload an audio file")
            return
        }

        const music: MusicFile = {
            file,
            name: file.name,
            size: file.size,
        }

        // Get duration
        const audio = new Audio()
        audio.src = URL.createObjectURL(file)
        audio.onloadedmetadata = () => {
            const mins = Math.floor(audio.duration / 60)
            const secs = Math.floor(audio.duration % 60)
            music.duration = `${mins}:${secs.toString().padStart(2, "0")}`
            setMusicFile({ ...music })
            uploadState.musicFile = music
            URL.revokeObjectURL(audio.src)
        }

        setMusicFile(music)
        uploadState.musicFile = music

        // Upload to TEE immediately after file selection
        const result = await uploadMusic(file)
        if (result) {
            uploadState.teeUploadResponse = result
        }
    }, [uploadMusic])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            const files = Array.from(e.dataTransfer.files)
            if (files[0]) handleFile(files[0])
        },
        [handleFile]
    )

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
        },
        [handleFile]
    )

    const removeFile = () => {
        setMusicFile(null)
        uploadState.musicFile = null
        uploadState.teeUploadResponse = null
        resetUpload()
    }

    const handleRetry = () => {
        if (musicFile?.file) {
            resetUpload()
            uploadMusic(musicFile.file).then((result) => {
                if (result) {
                    uploadState.teeUploadResponse = result
                }
            })
        }
    }

    const getStatusMessage = () => {
        switch (uploadStatus) {
            case "fetching-key":
                return "Fetching encryption key..."
            case "encrypting":
                return "Encrypting your music..."
            case "uploading":
                return "Uploading to secure storage..."
            case "success":
                return "Upload complete!"
            case "error":
                return uploadError || "Upload failed"
            default:
                return ""
        }
    }

    const isUploadComplete = uploadStatus === "success"
    const hasError = uploadStatus === "error"

    return (
        <div>
            <div className="px-2">
                <FamilyDrawerHeader
                    icon={<Music className="size-12 text-yellow-400" />}
                    title="Upload Music"
                    description="Select an audio file to upload"
                />
                <div className="mt-6">
                    {!musicFile ? (
                        <button
                            type="button"
                            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-yellow-400 bg-yellow-400/5" : "border-border bg-muted/30"
                                }`}
                        >
                            <Music className={`mx-auto mb-3 size-10 ${isDragging ? "text-yellow-400" : "text-muted-foreground"}`} />
                            <p className="mb-2 text-sm font-medium text-foreground">
                                {isDragging ? "Drop your music here" : "Drag and drop your music"}
                            </p>
                            <p className="mb-4 text-xs text-muted-foreground">MP3, WAV, FLAC, AAC supported</p>
                            <span className="inline-block rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black">
                                Choose File
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {/* File info card */}
                            <div className={`rounded-lg border p-4 ${hasError ? "border-red-500/50 bg-red-500/10" :
                                    isUploadComplete ? "border-green-500/50 bg-green-500/10" :
                                        "border-border bg-muted/30"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-12 items-center justify-center rounded-lg ${hasError ? "bg-red-500/20" :
                                            isUploadComplete ? "bg-green-500/20" :
                                                "bg-yellow-400/20"
                                        }`}>
                                        {isUploading ? (
                                            <Loader2 className="size-6 text-yellow-400 animate-spin" />
                                        ) : hasError ? (
                                            <AlertCircle className="size-6 text-red-500" />
                                        ) : isUploadComplete ? (
                                            <CheckCircle className="size-6 text-green-500" />
                                        ) : (
                                            <Music className="size-6 text-yellow-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">{musicFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(musicFile.size)} {musicFile.duration && `• ${musicFile.duration}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        disabled={isUploading}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                        <X className="size-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Upload progress/status */}
                            {(isUploading || hasError || isUploadComplete) && (
                                <div className="space-y-2">
                                    {/* Progress bar */}
                                    {isUploading && (
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Status message */}
                                    <div className={`flex items-center gap-2 text-xs ${hasError ? "text-red-500" :
                                            isUploadComplete ? "text-green-500" :
                                                "text-muted-foreground"
                                        }`}>
                                        {isUploading && <Loader2 className="size-3 animate-spin" />}
                                        {hasError && <AlertCircle className="size-3" />}
                                        {isUploadComplete && <CheckCircle className="size-3" />}
                                        <span>{getStatusMessage()}</span>
                                        {isUploading && <span className="ml-auto">{uploadProgress}%</span>}
                                    </div>

                                    {/* Retry button for errors */}
                                    {hasError && (
                                        <button
                                            onClick={handleRetry}
                                            className="w-full mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                                        >
                                            Retry Upload
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-7 flex gap-4">
                <FamilyDrawerSecondaryButton
                    onClick={() => setView("cover")}
                    // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                    disabled={!isUploadComplete}
                    className={`bg-yellow-400 text-black ${!isUploadComplete ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" /> Uploading...
                        </>
                    ) : (
                        <>
                            Continue <ArrowRight className="size-4" />
                        </>
                    )}
                </FamilyDrawerSecondaryButton>
            </div>
        </div>
    )
}

// ============================================================================
// Step 2: Upload Cover Image
// ============================================================================

function UploadCoverView() {
    const { setView } = useFamilyDrawer()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [coverImage, setCoverImage] = useState<CoverImage | null>(uploadState.coverImage)

    // Cloudinary upload hook
    const {
        uploadCover,
        isLoading: isUploading,
        error: uploadError,
        status: uploadStatus,
        progress: uploadProgress,
        reset: resetUpload
    } = useCoverUpload()

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file")
            return
        }

        // Create local preview immediately
        const reader = new FileReader()
        reader.onload = (e) => {
            const cover: CoverImage = {
                file,
                preview: e.target?.result as string,
            }
            setCoverImage(cover)
            uploadState.coverImage = cover
        }
        reader.readAsDataURL(file)

        // Upload to Cloudinary
        const result = await uploadCover(file)
        if (result) {
            uploadState.coverImageUrl = result.secure_url
        }
    }, [uploadCover])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            const files = Array.from(e.dataTransfer.files)
            if (files[0]) handleFile(files[0])
        },
        [handleFile]
    )

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
        },
        [handleFile]
    )

    const removeImage = () => {
        setCoverImage(null)
        uploadState.coverImage = null
        uploadState.coverImageUrl = null
        resetUpload()
    }

    const handleRetry = () => {
        if (coverImage?.file) {
            resetUpload()
            uploadCover(coverImage.file).then((result) => {
                if (result) {
                    uploadState.coverImageUrl = result.secure_url
                }
            })
        }
    }

    const getStatusMessage = () => {
        switch (uploadStatus) {
            case "uploading":
                return "Uploading to cloud..."
            case "success":
                return "Upload complete!"
            case "error":
                return uploadError || "Upload failed"
            default:
                return ""
        }
    }

    const isUploadComplete = uploadStatus === "success"
    const hasError = uploadStatus === "error"

    return (
        <div>
            <div className="px-2">
                <FamilyDrawerHeader
                    icon={<ImageIcon className="size-12 text-yellow-400" />}
                    title="Upload Cover Art"
                    description="Add album artwork for your track"
                />
                <div className="mt-6">
                    {!coverImage ? (
                        <button
                            type="button"
                            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-yellow-400 bg-yellow-400/5" : "border-border bg-muted/30"
                                }`}
                        >
                            <ImageIcon className={`mx-auto mb-3 size-10 ${isDragging ? "text-yellow-400" : "text-muted-foreground"}`} />
                            <p className="mb-2 text-sm font-medium text-foreground">
                                {isDragging ? "Drop your image here" : "Drag and drop cover image"}
                            </p>
                            <p className="mb-4 text-xs text-muted-foreground">PNG, JPG, WEBP • Recommended 1400x1400</p>
                            <span className="inline-block rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black">
                                Choose Image
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {/* Image preview */}
                            <div className="relative">
                                <div className={`aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border-2 ${hasError ? "border-red-500/50" :
                                        isUploadComplete ? "border-green-500/50" :
                                            "border-border"
                                    }`}>
                                    <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="size-8 text-white animate-spin" />
                                        </div>
                                    )}
                                    {isUploadComplete && (
                                        <div className="absolute bottom-2 right-2 p-1 rounded-full bg-green-500">
                                            <CheckCircle className="size-4 text-white" />
                                        </div>
                                    )}
                                    {hasError && (
                                        <div className="absolute bottom-2 right-2 p-1 rounded-full bg-red-500">
                                            <AlertCircle className="size-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={removeImage}
                                    disabled={isUploading}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-50"
                                >
                                    <X className="size-4 text-white" />
                                </button>
                            </div>

                            {/* File name */}
                            <p className="text-center text-xs text-muted-foreground">{coverImage.file.name}</p>

                            {/* Upload status */}
                            {(isUploading || hasError || isUploadComplete) && (
                                <div className="space-y-2">
                                    {/* Progress bar */}
                                    {isUploading && (
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Status message */}
                                    <div className={`flex items-center justify-center gap-2 text-xs ${hasError ? "text-red-500" :
                                            isUploadComplete ? "text-green-500" :
                                                "text-muted-foreground"
                                        }`}>
                                        {isUploading && <Loader2 className="size-3 animate-spin" />}
                                        {hasError && <AlertCircle className="size-3" />}
                                        {isUploadComplete && <CheckCircle className="size-3" />}
                                        <span>{getStatusMessage()}</span>
                                        {isUploading && <span>{uploadProgress}%</span>}
                                    </div>

                                    {/* Retry button for errors */}
                                    {hasError && (
                                        <button
                                            onClick={handleRetry}
                                            className="w-full mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                                        >
                                            Retry Upload
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-7 flex gap-4">
                <FamilyDrawerSecondaryButton onClick={() => setView("default")} className="bg-secondary text-secondary-foreground">
                    <ArrowLeft className="size-4" /> Back
                </FamilyDrawerSecondaryButton>
                <FamilyDrawerSecondaryButton
                    onClick={() => setView("metadata")}
                    // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                    disabled={!isUploadComplete}
                    className={`bg-yellow-400 text-black ${!isUploadComplete ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" /> Uploading...
                        </>
                    ) : (
                        <>
                            Continue <ArrowRight className="size-4" />
                        </>
                    )}
                </FamilyDrawerSecondaryButton>
            </div>
        </div>
    )
}

// ============================================================================
// Step 3: Metadata
// ============================================================================

function MetadataView() {
    const { setView } = useFamilyDrawer()
    const titleId = useId()
    const artistId = useId()
    const genreId = useId()
    const priceId = useId()
    const descId = useId()

    const [metadata, setMetadata] = useState<MusicMetadata>(uploadState.metadata)

    const updateMetadata = (field: keyof MusicMetadata, value: string) => {
        const updated = { ...metadata, [field]: value }
        setMetadata(updated)
        uploadState.metadata = updated
    }

    const isValid = metadata.title.trim() && metadata.artist.trim() && metadata.pricePerMonth.trim()

    return (
        <div>
            <div className="px-2 pt-4">
                <header className="flex items-center gap-3 mb-4">
                    <Music className="size-8 text-yellow-400" />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Track Details</h2>
                        <p className="text-xs text-muted-foreground">Add info about your music</p>
                    </div>
                </header>
                <div className="space-y-3">
                    {/* Title & Artist in grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor={titleId} className="text-xs font-medium text-foreground">Title *</label>
                            <input
                                id={titleId}
                                type="text"
                                value={metadata.title}
                                onChange={(e) => updateMetadata("title", e.target.value)}
                                placeholder="Track title"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor={artistId} className="text-xs font-medium text-foreground">Artist *</label>
                            <input
                                id={artistId}
                                type="text"
                                value={metadata.artist}
                                onChange={(e) => updateMetadata("artist", e.target.value)}
                                placeholder="Artist name"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                            />
                        </div>
                    </div>
                    {/* Genre & Price in grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor={genreId} className="text-xs font-medium text-foreground">Genre</label>
                            <select
                                id={genreId}
                                value={metadata.genre}
                                onChange={(e) => updateMetadata("genre", e.target.value)}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                            >
                                <option value="">Select genre</option>
                                <option value="pop">Pop</option>
                                <option value="rock">Rock</option>
                                <option value="hiphop">Hip Hop</option>
                                <option value="electronic">Electronic</option>
                                <option value="jazz">Jazz</option>
                                <option value="classical">Classical</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={priceId} className="text-xs font-medium text-foreground">Rent/Month *</label>
                            <div className="mt-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"><Image src="/ip.png" alt="IP" width={16} height={16} /></span>
                                <input
                                    id={priceId}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={metadata.pricePerMonth}
                                    onChange={(e) => updateMetadata("pricePerMonth", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Description */}
                    <div>
                        <label htmlFor={descId} className="text-xs font-medium text-foreground">Description</label>
                        <textarea
                            id={descId}
                            value={metadata.description}
                            onChange={(e) => updateMetadata("description", e.target.value)}
                            placeholder="Tell us about your track..."
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm resize-none"
                        />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex gap-3">
                <FamilyDrawerSecondaryButton onClick={() => setView("cover")} className="bg-secondary text-secondary-foreground">
                    <ArrowLeft className="size-4" /> Back
                </FamilyDrawerSecondaryButton>
                <FamilyDrawerSecondaryButton
                    onClick={() => setView("confirm")}
                    // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                    disabled={!isValid}
                    className={`bg-yellow-400 text-black ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    Continue <ArrowRight className="size-4" />
                </FamilyDrawerSecondaryButton>
            </div>
        </div>
    )
}

// ============================================================================
// Step 4: Confirm
// ============================================================================

function ConfirmView() {
    const { setView } = useFamilyDrawer()
    const { address } = useAccount()
    const { musicFile, coverImage, coverImageUrl, metadata, teeUploadResponse } = uploadState

    const {
        mintRecord,
        generateLicense,
        status: mintStatus,
        isLoading: isMinting,
        error: mintError,
        txHash,
        tokenId,
    } = useMintRecord()

    const formatFileSize = (bytes: number) => {
        const k = 1024
        const sizes = ["Bytes", "KB", "MB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const handleMint = async () => {
        if (!teeUploadResponse || !coverImageUrl) {
            alert("Missing upload data. Please go back and re-upload your files.")
            return
        }

        if (!address) {
            alert("Please connect your wallet to continue.")
            return
        }

        const encryptedCid = teeUploadResponse.payload.ipfsHash

        const success = await mintRecord({
            userAddress: address,
            metadata: {
                title: metadata.title,
                artist: metadata.artist,
                genre: metadata.genre,
                description: metadata.description,
                pricePerMonth: metadata.pricePerMonth,
                image: coverImageUrl,
                encryptedMusicCid: encryptedCid,
            },
            encryptedCid,
            pricePerMonth: metadata.pricePerMonth,
        })

        if (success) {
            // Status will update automatically via the hook
        }
    }

    // Navigate to complete view when minting is successful
    useEffect(() => {
        if (mintStatus === "success") {
            setView("complete")
        }
    }, [mintStatus, setView])

    const getStatusMessage = (): string => {
        switch (mintStatus) {
            case "uploading-metadata":
                return "Uploading metadata to IPFS..."
            case "waiting-approval":
                return "Waiting for wallet approval..."
            case "minting":
                return "Minting your record NFT..."
            case "confirming":
                return "Confirming transaction..."
            case "minted":
                return "NFT minted! Click 'Generate License' to register on Story Protocol."
            case "registering-ip":
                return "Registering IP on Story Protocol..."
            case "attaching-license":
                return "Attaching license terms..."
            case "notifying-tee":
                return "Registering with secure storage..."
            case "error":
                return mintError || "Transaction failed"
            default:
                return ""
        }
    }

    const hasError = mintStatus === "error"
    const isMinted = mintStatus === "minted"
    const isGeneratingLicense = ["registering-ip", "attaching-license", "notifying-tee"].includes(mintStatus)

    const handleGenerateLicense = async () => {
        await generateLicense()
    }

    return (
        <div>
            <div className="px-2">
                <FamilyDrawerHeader
                    icon={<CheckCircle className="size-12 text-yellow-400" />}
                    title="Review Upload"
                    description="Confirm your track details"
                />
                <div className="mt-6 space-y-4 border-t border-border pt-6">
                    {/* Preview Card */}
                    <div className="flex gap-4 rounded-lg border border-border bg-muted/30 p-4">
                        {coverImage && (
                            <div className="size-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{metadata.title}</p>
                            <p className="text-sm text-muted-foreground">{metadata.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {metadata.genre && <span className="text-xs text-muted-foreground capitalize">{metadata.genre}</span>}
                                {metadata.genre && metadata.pricePerMonth && <span className="text-xs text-muted-foreground">•</span>}
                                {metadata.pricePerMonth && <span className="text-xs font-medium text-yellow-400">${metadata.pricePerMonth}/mo</span>}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Audio file:</span>
                            <span className="font-medium text-foreground truncate max-w-[180px]">{musicFile?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">File size:</span>
                            <span className="font-medium text-foreground">{musicFile && formatFileSize(musicFile.size)}</span>
                        </div>
                        {musicFile?.duration && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="font-medium text-foreground">{musicFile.duration}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Rent:</span>
                            <span className="font-medium text-yellow-400">${metadata.pricePerMonth}/month</span>
                        </div>
                    </div>

                    {/* Minting Status */}
                    {(isMinting || isMinted || isGeneratingLicense || hasError) && (
                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className={`flex items-center gap-2 text-xs ${hasError ? "text-red-500" : isMinted ? "text-green-500" : "text-muted-foreground"}`}>
                                {(isMinting || isGeneratingLicense) && <Loader2 className="size-3 animate-spin" />}
                                {isMinted && <CheckCircle className="size-3" />}
                                {hasError && <AlertCircle className="size-3" />}
                                <span>{getStatusMessage()}</span>
                            </div>
                            {txHash && (
                                <p className="text-xs text-muted-foreground truncate">
                                    Tx: {txHash}
                                </p>
                            )}
                            {tokenId && (
                                <p className="text-xs text-muted-foreground truncate">
                                    Token ID: {tokenId}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-7 flex gap-4">
                <FamilyDrawerSecondaryButton
                    onClick={() => setView("metadata")}
                    className="bg-secondary text-secondary-foreground"
                    // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                    disabled={isMinting || isMinted || isGeneratingLicense}
                >
                    <ArrowLeft className="size-4" /> Back
                </FamilyDrawerSecondaryButton>

                {/* Show "Generate License" button when NFT is minted */}
                {isMinted ? (
                    <FamilyDrawerSecondaryButton
                        onClick={handleGenerateLicense}
                        className="bg-green-500 text-white"
                    >
                        <CheckCircle className="size-4" />
                         License
                    </FamilyDrawerSecondaryButton>
                ) : isGeneratingLicense ? (
                    <FamilyDrawerSecondaryButton
                        className="bg-yellow-400 text-black opacity-50 cursor-not-allowed"
                        // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                        disabled={true}
                    >
                        <Loader2 className="size-4 animate-spin" /> Waiting...
                    </FamilyDrawerSecondaryButton>
                ) : (
                    <FamilyDrawerSecondaryButton
                        onClick={handleMint}
                        className={`bg-yellow-400 text-black ${isMinting ? "opacity-50 cursor-not-allowed" : ""}`}
                        // @ts-expect-error - disabled prop is not defined in FamilyDrawerSecondaryButton
                        disabled={isMinting}
                    >
                        {isMinting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" /> Minting...
                            </>
                        ) : (
                            <>
                                <Upload className="size-4" />
                                Mint NFT
                            </>
                        )}
                    </FamilyDrawerSecondaryButton>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// Step 5: Complete
// ============================================================================

function CompleteView() {
    const { setView } = useFamilyDrawer()
    const { coverImage, metadata } = uploadState

    const handleUploadAnother = () => {
        resetUploadState()
        setView("default")
    }

    return (
        <div>
            <div className="px-2">
                <FamilyDrawerHeader
                    icon={<CheckCircle className="size-12 text-green-500" />}
                    title="Upload Complete!"
                    description="Your track has been uploaded successfully"
                />
                <div className="mt-6 space-y-4 border-t border-border pt-6">
                    {/* Success Card */}
                    <div className="flex gap-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                        {coverImage && (
                            <div className="size-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{metadata.title}</p>
                            <p className="text-sm text-muted-foreground">{metadata.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-green-500">✓ Published</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs font-medium text-yellow-400">${metadata.pricePerMonth}/mo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-7 flex gap-4">
                <FamilyDrawerSecondaryButton onClick={handleUploadAnother} className="bg-yellow-400 text-black">
                    <Upload className="size-4" /> Upload Another
                </FamilyDrawerSecondaryButton>
            </div>
        </div>
    )
}

// ============================================================================
// Views Registry
// ============================================================================

const musicUploadViews: ViewsRegistry = {
    default: UploadMusicView,
    cover: UploadCoverView,
    metadata: MetadataView,
    confirm: ConfirmView,
    complete: CompleteView,
}

// ============================================================================
// Export: Music Upload Drawer
// ============================================================================

interface MusicUploadDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MusicUploadDrawer({ open, onOpenChange }: MusicUploadDrawerProps) {
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) resetUploadState()
        onOpenChange(isOpen)
    }

    return (
        <FamilyDrawerRoot views={musicUploadViews} open={open} onOpenChange={handleOpenChange}>
            {/* Hidden trigger - we control open state externally */}
            <FamilyDrawerTrigger className="hidden">
                Open
            </FamilyDrawerTrigger>
            <FamilyDrawerPortal>
                <FamilyDrawerOverlay />
                <FamilyDrawerContent>
                    <FamilyDrawerClose />
                    <FamilyDrawerAnimatedWrapper>
                        <FamilyDrawerAnimatedContent>
                            <FamilyDrawerViewContent />
                        </FamilyDrawerAnimatedContent>
                    </FamilyDrawerAnimatedWrapper>
                </FamilyDrawerContent>
            </FamilyDrawerPortal>
        </FamilyDrawerRoot>
    )
}

export default MusicUploadDrawer