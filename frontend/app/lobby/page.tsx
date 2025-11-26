"use client";

import { useCallback, useEffect, useState } from "react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import NetworkStatus from "../../components/ui/NetworkStatus";
import RefreshIcon from "../../components/ui/RefreshIcon";
import SectionTitle from "../../components/ui/SectionTitle";
import SkeletonList from "../../components/ui/SkeletonList";
import Spinner from "../../components/ui/Spinner";
import {
  showError,
  showSuccess,
  showWarning,
} from "../../components/ui/Toaster";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { fetchGames, GameSummary } from "../../lib/api";

const statusColors: Record<string, string> = {
  Pending: "info",
  Ongoing: "success",
  Finished: "default",
  Cancelled: "danger",
};

export default function LobbyPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadGames = useCallback(
    async (options?: { silent?: boolean; background?: boolean }) => {
      if (!options?.background) setLoading(true);
      setRefreshing(true);
      setError(null);
      try {
        const data = await fetchGames();
        setGames(data);
        setLastUpdated(new Date());
        setHasLoadedOnce(true);
        if (!options?.silent) {
          showSuccess("Games updated.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load games";
        setError(message);
        showError(message);
      } finally {
        if (!options?.background) setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadGames({ silent: true });
  }, [loadGames]);

  useAutoRefresh(loadGames, 10000, autoRefresh);

  const handleJoin = (gameId: number) => {
    showWarning(`Joining game ${gameId} is simulated for this demo.`);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Master Mind Lobby"
        description="Browse available games and jump in."
        action={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <NetworkStatus />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
              />
              Auto refresh (10s)
            </label>
            <Button
              onClick={() => loadGames()}
              disabled={loading || refreshing}
            >
              <RefreshIcon spinning={refreshing || loading} />
              {(loading || refreshing) && <Spinner />} Refresh
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="text-sm text-slate-400">
          Last updated: {formatTime(lastUpdated)}
        </p>
      )}

      {loading && games.length === 0 && <SkeletonList count={6} />}

      {error && games.length === 0 && (
        <ErrorState message={error} onRetry={() => loadGames()} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const isFull =
            game.status === "Pending" &&
            game.playersCount >= game.maxPlayers;
          const isDisabled =
            game.status === "Finished" ||
            game.status === "Cancelled" ||
            isFull;

          return (
            <Card
              key={game.id}
              className="flex flex-col justify-between p-4 sm:p-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      Game #{game.id}
                    </h3>
                    <Badge
                      variant={statusColors[game.status] ?? "default"}
                    >
                      {game.status}
                    </Badge>
                  </div>
                  {isFull && game.status === "Pending" && (
                    <Badge
                      variant="warning"
                      className="uppercase"
                    >
                      Full
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <InfoRow label="Entry fee" value={`${game.entryFee} USDC`} />
                  <InfoRow label="Pool" value={`${game.pool} USDC`} />
                  <InfoRow
                    label="Players"
                    value={`${game.playersCount} / ${game.maxPlayers}`}
                  />
                  <InfoRow
                    label="Round"
                    value={`Round ${game.currentRound}`}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleJoin(game.id)}
                  disabled={isDisabled || loading || refreshing}
                >
                  {(loading || refreshing) && <Spinner />}
                  {game.status === "Finished"
                    ? "Finished"
                    : game.status === "Cancelled"
                    ? "Cancelled"
                    : isFull
                    ? "Lobby full"
                    : "Join"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && games.length === 0 && !error && hasLoadedOnce && (
        <EmptyState
          title="No games available"
          description="There aren't any open games right now. Try refreshing soon."
          action={
            <Button
              onClick={() => loadGames()}
              variant="secondary"
            >
              Refresh
            </Button>
          }
        />
      )}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
