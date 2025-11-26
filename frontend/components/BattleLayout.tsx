import { ReactNode } from "react";
import { GameDetail } from "../lib/api";

interface BattleLayoutProps {
  game?: GameDetail | null;
  children: ReactNode;
  lastUpdated?: Date | null;
}

export default function BattleLayout({ game, children, lastUpdated }: BattleLayoutProps) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Battle Arena</h2>
          <p className="text-slate-300">Compete in the Master Mind Rock–Paper–Scissors tournament.</p>
        </div>
        {lastUpdated && <p className="text-sm text-slate-400">Synced: {formatTime(lastUpdated)}</p>}
      </div>

      {game && (
        <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Game" value={`#${game.id}`} />
          <Info label="Status" value={game.status} />
          <Info label="Round" value={(game.round ?? game.currentRound ?? 1).toString()} />
          <Info label="Entry fee" value={`${game.entryFee} USDC`} />
          <Info label="Pool" value={`${game.pool} USDC`} />
          <Info label="Players" value={`${game.playersCount} / ${game.maxPlayers}`} />
        </div>
      )}

      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
