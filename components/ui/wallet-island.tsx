"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useDisconnect } from "wagmi"
import {
  DynamicContainer,
  DynamicIsland,
  DynamicIslandProvider,
  DynamicTitle,
  SIZE_PRESETS,
  useDynamicIslandSize,
} from "@/components/ui/dynamic-island"

const WalletIslandContent = () => {
  const { setSize, scheduleAnimation, state } = useDynamicIslandSize()
  const { isConnecting } = useAccount()
  const { disconnect: wagmiDisconnect, isPending: isDisconnecting } = useDisconnect()
  const isInitializedRef = useRef(false)
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [showDisconnecting, setShowDisconnecting] = useState(false)
  const [userClickedConnect, setUserClickedConnect] = useState(false)
  const prevIsConnecting = useRef(isConnecting)

  useEffect(() => {
    if (prevIsConnecting.current && !isConnecting) {
      setUserClickedConnect(false)
    }
    prevIsConnecting.current = isConnecting
  }, [isConnecting])

  useEffect(() => {
    if (!isInitializedRef.current) {
      setSize(SIZE_PRESETS.DEFAULT)
      isInitializedRef.current = true
    }
  }, [setSize])

  useEffect(() => {
    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current)
      }
    }
  }, [])

  const handleDisconnect = useCallback(() => {
    setShowDisconnecting(true)
    wagmiDisconnect()
    disconnectTimerRef.current = setTimeout(() => {
      setShowDisconnecting(false)
    }, 1000)
  }, [wagmiDisconnect])

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain

        useEffect(() => {
          if (!isInitializedRef.current) return

          let targetSize: typeof SIZE_PRESETS.DEFAULT | typeof SIZE_PRESETS.COMPACT = SIZE_PRESETS.DEFAULT
          if (connected || (userClickedConnect && isConnecting) || isDisconnecting || showDisconnecting) {
            targetSize = SIZE_PRESETS.COMPACT
          }

          if (state.size !== targetSize) {
            scheduleAnimation([{ size: targetSize, delay: 0 }])
          }
        }, [connected, userClickedConnect, isConnecting, isDisconnecting, showDisconnecting])

        const handleConnect = () => {
          setUserClickedConnect(true)
          openConnectModal()
        }

        // State 1: Connect Wallet
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

        // State 2: Connecting
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

        // State 3: Disconnecting
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

        // State 4: Address
        const renderAddressState = () => (
          <DynamicContainer className="flex items-center justify-center h-full w-full">
            <div
              className="relative w-full flex items-center justify-between px-3 cursor-pointer"
              onClick={handleDisconnect}
            >
              <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
                Wallet
              </DynamicTitle>
              <DynamicTitle className="my-auto text-sm font-black tracking-tighter text-white">
                {account?.displayName}
              </DynamicTitle>
            </div>
          </DynamicContainer>
        )

        const renderState = () => {
          if (connected) {
            return renderAddressState()
          }
          if (isDisconnecting || showDisconnecting) {
            return renderDisconnectingState()
          }
          if (userClickedConnect && isConnecting) {
            return renderConnectingState()
          }
          return renderConnectState()
        }

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            <DynamicIsland id="wallet-island">{renderState()}</DynamicIsland>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export function WalletIsland() {
  return (
    <DynamicIslandProvider initialSize={SIZE_PRESETS.DEFAULT}>
      <WalletIslandContent />
    </DynamicIslandProvider>
  )
}