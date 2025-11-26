"use client";

import { useAccount } from "wagmi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMe, fetchMyGames, GameSummary, MeProfile } from "../../lib/api";
import MyGameCard from "../../components/MyGameCard";

type StatusFilter = "all" | "pending" | "playing" | "finalized";
type SortBy = "recent" | "oldest" | "highestMedal";

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  playing: "Playing",
  finalized: "Finalized",
};

const sortLabels: Record<SortBy, string> = {
  recent: "Recent",
  oldest: "Oldest",
  highestMedal: "Highest Medal",
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function MyGamesPage() {
  const { address: wagmiAddress } = useAccount();
  const [address, setAddress] = useState("");
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [myGames, setMyGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (wagmiAddress) {
      setAddress(wagmiAddress);
    }
  }, [wagmiAddress]);

  const loadData = useCallback(async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Enter a wallet address to load your games.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profileData, games] = await Promise.all([fetchMe(trimmed), fetchMyGames(trimmed)]);
      setProfile(profileData);
      setMyGames(games);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your games");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (wagmiAddress) {
      loadData();
    }
  }, [loadData, wagmiAddress]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(id);
  }, [autoRefresh, loadData]);

  const displayedGames = useMemo(() => {
    let filtered = [...myGames];

    if (statusFilter === "pending") {
      filtered = filtered.filter((game) => game.status === "Pending");
    } else if (statusFilter === "playing") {
      filtered = filtered.filter((game) => game.status === "Ongoing");
    } else if (statusFilter === "finalized") {
      filtered = filtered.filter((game) => ["Finished", "Cancelled"].includes(game.status));
    }

    return filtered.sort((a, b) => {
      if (sortBy === "recent") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;

      const poolA = Number.parseFloat(a.pool.replace(/,/g, "")) || 0;
      const poolB = Number.parseFloat(b.pool.replace(/,/g, "")) || 0;
      return poolB - poolA;
    });
  }, [myGames, sortBy, statusFilter]);

  const estimatedMedals = profile && profile.gamesPlayed > 0 ? Math.round(profile.medals / profile.gamesPlayed) : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Games</h2>
          <p className="text-slate-300">View games you have joined or played with this wallet.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (10s)
          </label>
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm text-slate-300" htmlFor="address">
            Wallet address
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring focus:ring-indigo-500"
          />
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load my games"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {lastUpdated && <p className="text-sm text-slate-400">Last updated: {formatTime(lastUpdated)}</p>}
      </div>

      {profile && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile</h3>
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                {profile.activityTier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Medals" value={profile.medals} />
              <Stat label="Games played" value={profile.gamesPlayed} />
              <Stat label="Games won" value={profile.gamesWon} />
              <Stat label="Referred" value={profile.referredCount} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Sort by
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Status
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  {Object.entries(statusFilterLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              Estimated medals per game: <span className="font-semibold text-white">{estimatedMedals}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayedGames.map((game) => (
          <MyGameCard key={game.id} game={game} estimatedMedals={estimatedMedals} />
        ))}
      </div>

      {!loading && displayedGames.length === 0 && (
        <p className="text-sm text-slate-400">No games found for this wallet yet.</p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
