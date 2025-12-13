"use client"

import { useState } from "react"
import { Copy, Check, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { useAccount, useBalance } from "wagmi"
import Image from "next/image"
import FamilyButton from "@/components/ui/family-button"
import { MusicUploadDrawer } from "@/components/music-upload-drawer"

const TOKEN_ADDRESS = "0xF1815bd50389c46847f0Bda824eC8da914045D14" as const

export function FamilyButtonDemo() {
    // State to control the wallet button/popover
    const [walletOpen, setWalletOpen] = useState(false)
    // State to control the music upload drawer
    const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)

    const handleUploadClick = () => {
        setWalletOpen(false) // Close the wallet popover first
        // Small delay to let the wallet close before opening upload drawer
        setTimeout(() => {
            setUploadDrawerOpen(true)
        }, 150)
    }

    return (
        <div className="w-full h-full">
            <div className="absolute bottom-4 right-4">
                <FamilyButton open={walletOpen} onOpenChange={setWalletOpen}>
                    <WalletContent onUploadClick={handleUploadClick} />
                </FamilyButton>
            </div>

            {/* Music Upload Drawer - OUTSIDE of FamilyButton */}
            <MusicUploadDrawer 
                open={uploadDrawerOpen} 
                onOpenChange={setUploadDrawerOpen} 
            />
        </div>
    )
}

interface WalletContentProps {
    onUploadClick: () => void
}

function WalletContent({ onUploadClick }: WalletContentProps) {
    const [copied, setCopied] = useState(false)

    const { address: fullAddress, isConnected } = useAccount()

    const { data: tokenBalance } = useBalance({
        address: fullAddress,
        token: TOKEN_ADDRESS,
        query: {
            enabled: isConnected && !!fullAddress,
        },
    })

    const balance = tokenBalance
        ? parseFloat(tokenBalance.formatted).toFixed(2)
        : "0.00"

    const address = fullAddress
        ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`
        : "Not connected"

    const handleCopy = async () => {
        if (!fullAddress) return
        await navigator.clipboard.writeText(fullAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col items-center pt-4 w-full">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-xl font-semibold text-white mb-4"
            >
                <Image
                    src="/usdc.png"
                    alt="USDC"
                    width={24}
                    height={24}
                    className="rounded-full"
                />
                {balance} USDC
            </motion.div>

            {/* Address Section */}
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-2 mb-4 w-full border border-white/10"
            >
                <span className="text-xs text-neutral-300 flex-1 truncate">
                    {address}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-neutral-700/50 transition-colors"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                    )}
                </button>
            </motion.div>

            {/* Upload Button - triggers the external drawer */}
            <motion.button
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onUploadClick}
                className="flex items-center justify-center cursor-pointer hover:bg-yellow-400 hover:-translate-y-1.5 gap-2 w-full bg-yellow-300 text-black text-sm font-medium rounded-lg px-4 py-2.5 transition-all duration-200 shadow-lg shadow-cyan-500/20"
            >
                <Upload className="w-4 h-4" />
                Upload Music
            </motion.button>
        </div>
    )
}

export default FamilyButtonDemo