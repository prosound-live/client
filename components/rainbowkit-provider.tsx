'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { storyAeneid } from 'viem/chains';

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'ProSound',
  projectId: process.env.NEXT_PUBLIC_REOWN_APP_ID || 'wallet-app-id',
  chains: [storyAeneid],
  ssr: true,
});

export const RainbowkitProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
