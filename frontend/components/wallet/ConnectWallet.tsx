"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "@wagmi/core";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, status } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        className="px-3 py-2 rounded bg-emerald-500 text-slate-900 text-sm font-semibold"
        onClick={() => disconnect()}
      >
        Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      className="px-3 py-2 rounded bg-emerald-500 text-slate-900 text-sm font-semibold"
      onClick={() => connect({ connector: connectors[0] })}
      disabled={status === "pending"}
    >
      {status === "pending" ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
