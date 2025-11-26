import { Chain } from "wagmi";

export const monadTestnet: Chain = {
  id: 282828,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "http://localhost:8545"] },
    public: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "http://localhost:8545"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://explorer.monad.local" },
  },
};
