import { GameSummary } from "../lib/api";

const statusStyles: Record<string, string> = {
  pending: "bg-blue-900 text-blue-100 border border-blue-700",
  playing: "bg-emerald-900 text-emerald-100 border border-emerald-700",
  finalized: "bg-slate-800 text-slate-200 border border-slate-700",
};

const normalizeStatus = (status: string) => {
  if (status === "Pending") return "pending";
  if (status === "Ongoing") return "playing";
  if (status === "Finished" || status === "Cancelled") return "finalized";
  return "pending";
};

export function MyGameCard({ game, estimatedMedals }: { game: GameSummary; estimatedMedals: number }) {
  const normalizedStatus = normalizeStatus(game.status);
  const statusLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Game #{game.id}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              statusStyles[normalizedStatus] ?? "bg-slate-800 text-slate-200 border border-slate-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <span className="text-xs text-slate-400">Round {game.currentRound}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
        <InfoBlock label="Players" value={`${game.playersCount} / ${game.maxPlayers}`} />
        <InfoBlock label="Entry fee" value={`${game.entryFee} USDC`} />
        <InfoBlock label="Pool" value={`${game.pool} USDC`} />
        <InfoBlock label="Est. medals" value={estimatedMedals.toString()} />
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default MyGameCard;
