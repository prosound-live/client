"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Copy, Check, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { useAccount, useBalance } from "wagmi"
import Image from "next/image"
import FamilyButton from "@/components/ui/family-button"
import { MusicUploadDrawer } from "@/components/music-upload-drawer"
import { MOCKERC20_ADDRESS } from "@/lib/constants"

interface FamilyButtonContextType {
  walletOpen: boolean
  setWalletOpen: (open: boolean) => void
  uploadDrawerOpen: boolean
  setUploadDrawerOpen: (open: boolean) => void
}

const FamilyButtonContext = createContext<FamilyButtonContextType | null>(null)

export function useFamilyButton() {
  const context = useContext(FamilyButtonContext)
  if (!context) {
    throw new Error("useFamilyButton must be used within FamilyButtonProvider")
  }
  return context
}

function WalletContent({ onUploadClick }: { onUploadClick: () => void }) {
  const [copied, setCopied] = useState(false)
  const { address: fullAddress, isConnected } = useAccount()

  const { data: tokenBalance } = useBalance({
    address: fullAddress,
    token: MOCKERC20_ADDRESS,
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
          src="/ip.png"
          alt="USDC"
          width={24}
          height={24}
          className="rounded-full"
        />
        {balance} IP
      </motion.div>

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

export function FamilyButtonProvider({ children }: { children: ReactNode }) {
  const [walletOpen, setWalletOpen] = useState(false)
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)

  const handleUploadClick = () => {
    setWalletOpen(false)
    setTimeout(() => {
      setUploadDrawerOpen(true)
    }, 150)
  }

  return (
    <FamilyButtonContext.Provider
      value={{ walletOpen, setWalletOpen, uploadDrawerOpen, setUploadDrawerOpen }}
    >
      {children}

      {/* FamilyButton rendered once at provider level - never remounts */}
      <div className="fixed bottom-4 right-4 z-50">
        <FamilyButton open={walletOpen} onOpenChange={setWalletOpen}>
          <WalletContent onUploadClick={handleUploadClick} />
        </FamilyButton>
      </div>

      <MusicUploadDrawer
        open={uploadDrawerOpen}
        onOpenChange={setUploadDrawerOpen}
      />
    </FamilyButtonContext.Provider>
  )
}
