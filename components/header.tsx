"use client"

import { motion } from "framer-motion"
import { WalletIsland } from "@/components/ui/wallet-island"
import Link from "next/link"

export function Header() {
    return (
        <div className="fixed top-0 left-0 right-0 z-40">
            <motion.div
                className="absolute top-6 left-6 text-neutral-400 text-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                        delay: 0.1,
                        duration: 0.4,
                        ease: "easeOut",
                    }
                }}
            >
                ✧ ProSound
            </motion.div>
            <motion.div
                className='absolute top-6 right-6 z-50'
                initial={{ opacity: 0, x: 20 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                        delay: 0.15,
                        duration: 0.4,
                        ease: "easeOut",
                    }
                }}
            >
                <WalletIsland />
            </motion.div>
            <nav className="flex justify-center items-center p-6 gap-6 text-sm tracking-wide text-neutral-500 bg-neutral-200 dark:bg-neutral-900">
                <Link href="/" className="hover:text-neutral-800 transition-colors font-semibold tracking-tight">Home</Link>
                <span className="text-neutral-400">|</span>
                <Link href="/my-songs" className="hover:text-neutral-800 transition-colors font-semibold tracking-tight">My Songs</Link >
            </nav>
        </div>
    )
}

