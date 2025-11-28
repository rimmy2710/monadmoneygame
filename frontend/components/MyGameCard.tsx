import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { GameSummary } from "../lib/api";

type BadgeVariant = "default" | "info" | "success" | "warning" | "danger" | "secondary" | "soft";

const statusVariants: Record<string, BadgeVariant> = {
  pending: "info",
  playing: "success",
  finalized: "secondary",
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
    <Card className="flex flex-col gap-3 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Game #{game.id}</h3>
          <Badge variant={statusVariants[normalizedStatus] ?? "default"}>{statusLabel}</Badge>
        </div>
        <Badge variant="soft" className="text-[11px] uppercase">
          Round {game.currentRound}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
        <InfoBlock label="Players" value={`${game.playersCount} / ${game.maxPlayers}`} />
        <InfoBlock label="Entry fee" value={`${game.entryFee} USDC`} />
        <InfoBlock label="Pool" value={`${game.pool} USDC`} />
        <InfoBlock label="Est. medals" value={estimatedMedals.toString()} />
      </div>
    </Card>
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
