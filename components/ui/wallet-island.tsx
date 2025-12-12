"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "lucide-react"
import {
  DynamicContainer,
  DynamicDescription,
  DynamicIsland,
  DynamicIslandProvider,
  DynamicTitle,
  SIZE_PRESETS,
  useDynamicIslandSize,
} from "@/components/ui/dynamic-island"

type WalletState = "disconnected" | "connecting" | "connected" | "disconnecting"

const WalletIslandContent = () => {
  const { setSize, scheduleAnimation, state } = useDynamicIslandSize()
  const [walletState, setWalletState] = useState<WalletState>("disconnected")
  const [address] = useState("0x1234...5678") // Static value for now
  const isInitializedRef = useRef(false)

  // Initialize size on mount without animation
  useEffect(() => {
    if (!isInitializedRef.current) {
      setSize(SIZE_PRESETS.DEFAULT)
      isInitializedRef.current = true
    }
  }, [setSize])

  const handleConnect = () => {
    setWalletState("connecting")
    // Simulate connection process
    setTimeout(() => {
      setWalletState("connected")
    }, 1500) // 1.5 second loading
  }

  const handleDisconnect = () => {
    setWalletState("disconnecting")
    // Simulate disconnection process
    setTimeout(() => {
      setWalletState("disconnected")
    }, 1000) // 1 second loading
  }

  // Ensure size updates when state changes - only after initialization
  useEffect(() => {
    if (!isInitializedRef.current) return

    let targetSize: typeof SIZE_PRESETS.DEFAULT | typeof SIZE_PRESETS.COMPACT = SIZE_PRESETS.DEFAULT
    if (walletState === "connecting" || walletState === "disconnecting") {
      targetSize = SIZE_PRESETS.COMPACT
    } else if (walletState === "connected") {
      targetSize = SIZE_PRESETS.COMPACT
    } else if (walletState === "disconnected") {
      targetSize = SIZE_PRESETS.DEFAULT
    }

    // Only animate if size is actually different
    if (state.size !== targetSize) {
      scheduleAnimation([{ size: targetSize, delay: 0 }])
    }
  }, [walletState, scheduleAnimation, state.size])

  const handleAddressClick = () => {
    handleDisconnect()
  }

  // State 1: Connect Wallet (default/minimal)
  const renderConnectState = () => (
    <DynamicContainer className="flex items-center justify-center h-full w-full">
      <div
        className="relative w-full flex items-center justify-center px-4 cursor-pointer"
        onClick={handleConnect}
      >
         <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
          Connect Wallet
        </DynamicTitle>
      </div>
    </DynamicContainer>
  )

  // State 2: Connecting (loading state)
  const renderConnectingState = () => (
    <DynamicContainer className="flex items-center justify-center h-full w-full">
      <div className="relative flex w-full items-center justify-between gap-6 px-4">
        <Loader className="animate-spin h-5 w-5 text-yellow-300" />
        <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
          Connecting
        </DynamicTitle>
      </div>
    </DynamicContainer>
  )

  // State 3: Disconnecting (loading state)
  const renderDisconnectingState = () => (
    <DynamicContainer className="flex items-center justify-center h-full w-full">
      <div className="relative flex w-full items-center justify-between gap-6 px-4">
        <Loader className="animate-spin h-5 w-5 text-yellow-300" />
        <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
          Disconnecting
        </DynamicTitle>
      </div>
    </DynamicContainer>
  )

  // State 4: Address (compact - showing connected address)
  const renderAddressState = () => (
    <DynamicContainer className="flex items-center justify-center h-full w-full">
      <div
        className="relative w-full flex items-center justify-between px-3 cursor-pointer"
        onClick={handleAddressClick}
      >
        <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
          Wallet
        </DynamicTitle>
        <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
          {address}
        </DynamicTitle>
      </div>
    </DynamicContainer>
  )

  // Main render logic based on wallet state
  const renderState = () => {
    switch (walletState) {
      case "disconnected":
        return renderConnectState()
      case "connecting":
        return renderConnectingState()
      case "connected":
        return renderAddressState()
      case "disconnecting":
        return renderDisconnectingState()
      default:
        return renderConnectState()
    }
  }

  return (
    <DynamicIsland id="wallet-island">{renderState()}</DynamicIsland>
  )
}

export function WalletIsland() {
  return (
    <DynamicIslandProvider initialSize={SIZE_PRESETS.DEFAULT}>
      <WalletIslandContent />
    </DynamicIslandProvider>
  )
}

