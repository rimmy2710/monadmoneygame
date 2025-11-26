"use client";

import { useAccount } from "wagmi";
import { useCallback, useEffect, useMemo, useState } from "react";
import MyGameCard from "../../components/MyGameCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import NetworkStatus from "../../components/ui/NetworkStatus";
import RefreshIcon from "../../components/ui/RefreshIcon";
import SectionTitle from "../../components/ui/SectionTitle";
import SkeletonCard from "../../components/ui/SkeletonCard";
import Spinner from "../../components/ui/Spinner";
import { showError, showSuccess, showWarning } from "../../components/ui/Toaster";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { fetchMe, fetchMyGames, GameSummary, MeProfile } from "../../lib/api";

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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (wagmiAddress) {
      setAddress(wagmiAddress);
    }
  }, [wagmiAddress]);

  const loadData = useCallback(async (options?: { silent?: boolean; background?: boolean }) => {
    const trimmed = address.trim();
    if (!trimmed) {
      const message = "Enter a wallet address to load your games.";
      setError(message);
      if (!options?.background) {
        showWarning(message);
      }
      return;
    }

    if (!options?.background) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const [profileData, games] = await Promise.all([fetchMe(trimmed), fetchMyGames(trimmed)]);
      setProfile(profileData);
      setMyGames(games);
      setLastUpdated(new Date());
      setHasLoadedOnce(true);
      if (!options?.silent) {
        showSuccess("Your games are up to date.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load your games";
      setError(message);
      showError(message);
    } finally {
      if (!options?.background) setLoading(false);
      setRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    if (wagmiAddress) {
      loadData({ silent: true });
    }
  }, [loadData, wagmiAddress]);

  useAutoRefresh(loadData, 20000, autoRefresh);

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
      <SectionTitle
        title="My Games"
        description="View games you have joined or played with this wallet."
        action={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <NetworkStatus />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto refresh (20s)
            </label>
            <Button onClick={loadData} disabled={loading || refreshing}>
              <RefreshIcon spinning={refreshing || loading} />
              {(loading || refreshing) && <Spinner />} Refresh
            </Button>
          </div>
        }
      />

      <Card className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm text-slate-300" htmlFor="address">
            Wallet address
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          />
          <Button
            variant="secondary"
            onClick={loadData}
            disabled={loading || refreshing}
            className="min-w-[140px]"
          >
            <RefreshIcon spinning={refreshing || loading} />
            {(loading || refreshing) && <Spinner />} Load my games
          </Button>
        </div>
        {lastUpdated && <p className="text-sm text-slate-400">Last updated: {formatTime(lastUpdated)}</p>}
      </Card>

      {loading && myGames.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
        </div>
      )}

      {error && myGames.length === 0 && <ErrorState message={error} onRetry={loadData} />}
      {error && myGames.length > 0 && <ErrorState message={error} onRetry={loadData} />}

      {profile && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Profile</h3>
                <p className="text-sm text-slate-400">Performance overview</p>
              </div>
              <Badge variant="info">{profile.activityTier}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Medals" value={profile.medals} />
              <Stat label="Games played" value={profile.gamesPlayed} />
              <Stat label="Games won" value={profile.gamesWon} />
              <Stat label="Referred" value={profile.referredCount} />
            </div>
          </Card>
          <Card className="space-y-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Filters</h3>
              <Badge variant="default">Customize</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Sort by
                <select
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
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
                  className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
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
            <div className="rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
              Estimated medals per game: <span className="font-semibold text-white">{estimatedMedals}</span>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        {displayedGames.map((game) => (
          <MyGameCard key={game.id} game={game} estimatedMedals={estimatedMedals} />
        ))}
      </div>

      {!loading && displayedGames.length === 0 && hasLoadedOnce && (
        <EmptyState
          title="No games found"
          description="You haven't joined any games with this wallet yet."
          action={
            <Button variant="secondary" onClick={loadData}>
              Refresh
            </Button>
          }
        />
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
