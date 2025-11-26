"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig, createConfig, http } from "wagmi";
import { monadTestnet } from "../lib/monad";
import { injected } from "@wagmi/core";
import { ReactNode, useMemo } from "react";
import ConnectWallet from "./wallet/ConnectWallet";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || "")
  },
  connectors: [injected()],
});

export default function Providers({ children }: { children: ReactNode }) {
  const config = useMemo(() => wagmiConfig, []);
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}

Providers.ConnectButton = ConnectWallet;
