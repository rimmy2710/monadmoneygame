"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Spinner from "../../components/ui/Spinner";
import { fetchLeaderboard, LeaderboardEntry } from "../../lib/api";

const sortOptions = [
  { label: "Medals", value: "medals" },
  { label: "Games Won", value: "gamesWon" },
  { label: "Referrals", value: "referredCount" },
];

const limits = [10, 25, 50, 100];

type BadgeVariantKey = "default" | "info" | "success" | "warning" | "danger";

const tierColors: Record<string, BadgeVariantKey> = {
  Bronze: "warning",
  Silver: "default",
  Gold: "success",
  Platinum: "info",
  Diamond: "info",
};

const rankBorder = (rank: number) => {
  if (rank === 1) return "border-yellow-400 shadow-lg shadow-yellow-900/40";
  if (rank === 2) return "border-slate-300 shadow-md shadow-slate-900/40";
  if (rank === 3) return "border-amber-500 shadow-md shadow-amber-900/40";
  return "border-white/10";
};

const shortAddress = (address: string) =>
  address.length <= 10 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`;

const socialBadge = (label: string, variant: BadgeVariantKey) => (
  <Badge variant={variant} className="text-[11px]">{label}</Badge>
);

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<"medals" | "gamesWon" | "referredCount">("medals");
  const [limit, setLimit] = useState<number>(50);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(sortBy, limit);
      setEntries(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [limit, sortBy]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadLeaderboard();
    }, 10000);

    return () => clearInterval(id);
  }, [autoRefresh, loadLeaderboard]);

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Master Mind Leaderboard"
        description="Top players ranked by medals, wins, or referrals."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              Sort by
              <select
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-200">
              Limit
              <select
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {limits.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto refresh (10s)
            </label>

            <Button onClick={loadLeaderboard} disabled={loading}>
              {loading && <Spinner />} Refresh
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="text-sm text-slate-400">Last updated: {formatTime(lastUpdated)}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3">
        {entries.map((player, index) => {
          const borderClass = rankBorder(index + 1);
          const tierVariant = tierColors[player.activityTier] ?? "default";
          return (
            <Card
              key={player.address}
              className={`flex flex-col gap-4 border ${borderClass} p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6`}
            >
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                  {player.address.slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                    <span className="text-slate-300">#{index + 1}</span>
                    <span>{shortAddress(player.address)}</span>
                    <Badge variant={tierVariant}>{player.activityTier}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {player.linkedSocials.gmail && socialBadge("Gmail", "warning")}
                    {player.linkedSocials.x && socialBadge("X", "default")}
                    {player.linkedSocials.discord && socialBadge("Discord", "info")}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-6 text-right text-sm sm:text-base">
                <StatBlock label="Medals" value={player.medals} />
                <StatBlock label="Wins" value={player.gamesWon} subLabel={`/${player.gamesPlayed} played`} />
                <StatBlock label="Referrals" value={player.referredCount} />
              </div>
            </Card>
          );
        })}

        {!loading && entries.length === 0 && !error && (
          <p className="text-sm text-slate-400">No leaderboard entries available.</p>
        )}
      </div>
    </section>
  );
}

function StatBlock({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: number;
  subLabel?: string;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {subLabel && <div className="text-[11px] text-slate-500">{subLabel}</div>}
    </div>
  );
}
