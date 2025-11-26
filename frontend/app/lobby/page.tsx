"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGames, GameSummary } from "../../lib/api";

const statusColors: Record<string, string> = {
  Pending: "bg-blue-900 text-blue-100 border border-blue-700",
  Ongoing: "bg-emerald-900 text-emerald-100 border border-emerald-700",
  Finished: "bg-slate-800 text-slate-200 border border-slate-700",
  Cancelled: "bg-red-900 text-red-100 border border-red-700",
};

export default function LobbyPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGames();
      setGames(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadGames();
    }, 10000);

    return () => clearInterval(id);
  }, [autoRefresh, loadGames]);

  const handleJoin = (gameId: number) => {
    window.alert(`Joining game ${gameId} (mock)`);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Master Mind Lobby</h2>
          <p className="text-slate-300">Browse available games and jump in.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
            />
            Auto refresh (10s)
          </label>
          <button
            className={[
              "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow",
              "hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
            onClick={loadGames}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-slate-400">Last updated: {formatTime(lastUpdated)}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const isFull = game.status === "Pending" && game.playersCount >= game.maxPlayers;
          const isDisabled = game.status === "Finished" || game.status === "Cancelled" || isFull;

          return (
            <div key={game.id} className="flex flex-col justify-between rounded-xl border border-slate-800 p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Game #{game.id}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        statusColors[game.status] ?? "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>
                  {isFull && game.status === "Pending" && (
                    <span className="text-xs font-semibold text-yellow-400">Full</span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <InfoRow label="Entry fee" value={`${game.entryFee} USDC`} />
                  <InfoRow label="Pool" value={`${game.pool} USDC`} />
                  <InfoRow label="Players" value={`${game.playersCount} / ${game.maxPlayers}`} />
                  <InfoRow label="Round" value={`Round ${game.currentRound}`} />
                </div>
              </div>

              <div className="pt-3">
                <button
                  className={[
                    "w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow",
                    "hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                  onClick={() => handleJoin(game.id)}
                  disabled={isDisabled}
                >
                  {game.status === "Finished"
                    ? "Finished"
                    : game.status === "Cancelled"
                      ? "Cancelled"
                      : isFull
                        ? "Lobby full"
                        : "Join"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && games.length === 0 && !error && (
        <p className="text-sm text-slate-400">No games available right now. Try refreshing soon.</p>
      )}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
