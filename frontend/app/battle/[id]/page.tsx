"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import BattleLayout from "../../../components/BattleLayout";
import Countdown from "../../../components/Countdown";
import RoundResult from "../../../components/RoundResult";
import RPSMoveButton from "../../../components/RPSMoveButton";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import Divider from "../../../components/ui/Divider";
import NetworkStatus from "../../../components/ui/NetworkStatus";
import RefreshIcon from "../../../components/ui/RefreshIcon";
import SectionTitle from "../../../components/ui/SectionTitle";
import SkeletonCard from "../../../components/ui/SkeletonCard";
import Spinner from "../../../components/ui/Spinner";

import {
  showError,
  showSuccess,
  showWarning,
} from "../../../components/ui/Toaster";
import useAutoRefresh from "../../../hooks/useAutoRefresh";
import {
  commitMove,
  fetchGameDetail,
  GameDetail,
  revealMove,
} from "../../../lib/api";

type Move = "rock" | "paper" | "scissors";
type Phase = "commit" | "reveal" | "result";

const COMMIT_DURATION = 15;
const REVEAL_DURATION = 15;

const moveIcons: Record<Move, string> = {
  rock: "🪨",
  paper: "📜",
  scissors: "✂️",
};

export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { address: wagmiAddress } = useAccount();

  const gameId = useMemo(() => Number(params?.id ?? 0), [params]);

  const [address, setAddress] = useState("");
  const [game, setGame] = useState<GameDetail | null>(null);
  const [phase, setPhase] = useState<Phase>("commit");
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [playerCommit, setPlayerCommit] = useState<string | null>(null);
  const [commitSalt, setCommitSalt] = useState<string>("");
  const [roundResult, setRoundResult] = useState<"win" | "lose" | "draw" | null>(
    null
  );
  const [roundNumber, setRoundNumber] = useState(1);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [commitTimeLeft, setCommitTimeLeft] = useState(COMMIT_DURATION);
  const [revealTimeLeft, setRevealTimeLeft] = useState(REVEAL_DURATION);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRevealed, setAutoRevealed] = useState(false);

  useEffect(() => {
    if (wagmiAddress) {
      setAddress(wagmiAddress);
    }
  }, [wagmiAddress]);

  useEffect(() => {
    setCommitSalt(randomSalt());
  }, []);

  const derivePhase = useCallback(
    (data?: GameDetail | null): Phase => {
      if (data?.phase) return data.phase;
      if (!playerCommit) return "commit";
      if (roundResult) return "result";
      return "reveal";
    },
    [playerCommit, roundResult]
  );

  const deriveOpponent = useCallback(
    (data: GameDetail | null, who: string) => {
      if (!data?.players || !who) return null;
      const normalized = who.toLowerCase();
      const other = data.players.find((p) => p.toLowerCase() !== normalized);
      return other ?? null;
    },
    []
  );

  const loadGame = useCallback(
    async (options?: { silent?: boolean; background?: boolean }) => {
      if (!gameId) return;
      if (!options?.background) setSyncing(true);
      setError(null);

      try {
        const data = await fetchGameDetail(gameId);
        setGame(data);
        setRoundNumber(data.round ?? data.currentRound ?? 1);
        setPhase(derivePhase(data));
        setOpponent(deriveOpponent(data, address));
        if (data.result) setRoundResult(data.result);
        setLastUpdated(new Date());
        if (!options?.silent) {
          showSuccess("Battle synced");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load battle state";
        setError(message);
        showError(message);
      } finally {
        setSyncing(false);
      }
    },
    [address, deriveOpponent, derivePhase, gameId]
  );

  useEffect(() => {
    if (!gameId) return;
    void loadGame({ silent: true });
  }, [gameId, loadGame]);

  useAutoRefresh(loadGame, 3000, autoRefresh);

  // Timers
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (phase === "commit") {
      setCommitTimeLeft(COMMIT_DURATION);
      interval = setInterval(() => {
        setCommitTimeLeft((time) => {
          if (time <= 1) {
            setPhase("reveal");
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (phase === "reveal") {
      setAutoRevealed(false);
      setRevealTimeLeft(REVEAL_DURATION);
      interval = setInterval(() => {
        setRevealTimeLeft((time) => Math.max(0, time - 1));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, roundNumber]);

  // Auto reveal
  useEffect(() => {
    if (
      phase === "reveal" &&
      revealTimeLeft === 0 &&
      playerMove &&
      playerCommit &&
      !autoRevealed
    ) {
      setAutoRevealed(true);
      void handleReveal(true);
    }
  }, [autoRevealed, handleReveal, phase, playerCommit, playerMove, revealTimeLeft]);

  // Detect round change from backend
  useEffect(() => {
    if (game && (game.round ?? game.currentRound ?? 1) !== roundNumber) {
      const nextRound = game.round ?? game.currentRound ?? 1;
      setRoundNumber(nextRound);
      setPhase(derivePhase(game));
      setRoundResult(game.result ?? null);
      setPlayerCommit(null);
      setPlayerMove(null);
      setCommitSalt(randomSalt());
    }
  }, [derivePhase, game, roundNumber]);

  // Reset to next round if not finished
  useEffect(() => {
    if (phase === "result" && (!game || game.status !== "Finished")) {
      const timeout = setTimeout(() => {
        setPhase("commit");
        setRoundResult(null);
        setPlayerCommit(null);
        setPlayerMove(null);
        setCommitSalt(randomSalt());
      }, 2500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [game, phase]);

  const handleCommit = useCallback(async () => {
    if (!address) {
      const message = "Connect a wallet or enter an address to commit.";
      setError(message);
      showWarning(message);
      return;
    }
    if (!playerMove) {
      const message = "Choose Rock, Paper, or Scissors first.";
      setError(message);
      showWarning(message);
      return;
    }

    const salt = commitSalt || randomSalt();
    setCommitSalt(salt);

    try {
      setError(null);
      setActionLoading(true);
      const commitment = await generateCommitment(playerMove, salt);
      await commitMove(gameId, address, commitment);
      setPlayerCommit(commitment);
      setPhase("reveal");
      showSuccess("Move committed. Reveal when ready.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to commit move";
      setError(message);
      showError(message);
    }
    setActionLoading(false);
  }, [address, commitSalt, gameId, playerMove]);

  const handleReveal = useCallback(
    async (auto?: boolean) => {
      if (!address || !playerMove || !commitSalt) {
        const message = "Missing move or salt to reveal.";
        setError(message);
        showWarning(message);
        return;
      }

      try {
        setError(null);
        setActionLoading(true);
        const response = await revealMove(gameId, address, playerMove, commitSalt);
        const nextResult =
          (response as { result?: "win" | "lose" | "draw" })?.result ??
          roundResult ??
          null;
        if (nextResult) setRoundResult(nextResult);
        setPhase("result");
        await loadGame({ silent: true });
        if (auto) {
          setAutoRevealed(true);
        }
        showSuccess("Move revealed");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reveal move";
        setError(message);
        if (!auto) {
          showError(message);
        }
      }
      setActionLoading(false);
    },
    [address, commitSalt, gameId, loadGame, playerMove, roundResult]
  );

  const shortAddr = useMemo(
    () => (address ? shortAddress(address) : ""),
    [address]
  );
  const opponentShort = useMemo(
    () => (opponent ? shortAddress(opponent) : "Waiting"),
    [opponent]
  );

  const totalRounds = useMemo(() => {
    if (game?.playersCount && game.playersCount <= 2) return 5;
    return 3;
  }, [game]);

  const isFinalChampion = useMemo(
    () =>
      game?.status === "Finished" &&
      (roundResult === "win" || game?.result === "win"),
    [game, roundResult]
  );

  return (
    <BattleLayout game={game} lastUpdated={lastUpdated}>
      <SectionTitle
        title={`Battle #${gameId || "-"}`}
        description="Commit and reveal your moves to claim victory."
        action={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <NetworkStatus pollMs={6000} />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto refresh (3s)
            </label>
            <Button
              variant="secondary"
              onClick={() => loadGame()}
              disabled={syncing}
            >
              <RefreshIcon spinning={syncing} />{" "}
              {syncing && <Spinner />}{" "}
              {syncing ? "Syncing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      {syncing && !game && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {error && !game && (
        <ErrorState message={error} onRetry={() => loadGame()} />
      )}
      {error && game && (
        <ErrorState message={error} onRetry={() => loadGame()} />
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-slate-400">
                  You
                </p>
                <p className="text-xl font-semibold text-white">
                  {shortAddr || "Not connected"}
                </p>
              </div>
              <div className="text-center text-sm text-slate-400">VS</div>
              <div className="space-y-1 text-right">
                <p className="text-sm uppercase tracking-wide text-slate-400">
                  Opponent
                </p>
                <p className="text-xl font-semibold text-white">
                  {opponent ? opponentShort : "Waiting for opponent"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <Badge variant="info">Best of {totalRounds}</Badge>
              {game?.playersCount % 2 === 1 && (
                <Badge variant="warning">10% lucky auto-pass active</Badge>
              )}
              {game?.status && (
                <Badge variant="secondary">{game.status}</Badge>
              )}
            </div>
          </Card>

          <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Round {roundNumber}</h3>
              <Badge variant="default" className="uppercase">
                {phase} phase
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(moveIcons) as Move[]).map((move) => (
                <RPSMoveButton
                  key={move}
                  move={move}
                  icon={moveIcons[move]}
                  label={move}
                  selected={playerMove === move}
                  disabled={!!playerCommit || phase !== "commit"}
                  onSelect={setPlayerMove}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Button
                variant="primary"
                onClick={handleCommit}
                disabled={
                  phase !== "commit" ||
                  !!playerCommit ||
                  syncing ||
                  actionLoading
                }
              >
                {actionLoading && <Spinner />}{" "}
                {playerCommit ? "Committed" : "Commit Move"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handleReveal()}
                disabled={
                  phase !== "reveal" ||
                  !playerCommit ||
                  !playerMove ||
                  syncing ||
                  actionLoading
                }
              >
                {actionLoading && <Spinner />} Reveal Move
              </Button>
              {playerMove && commitSalt && (
                <Badge variant="soft" className="normal-case">
                  Salt: {commitSalt.slice(0, 6)}...{commitSalt.slice(-4)}
                </Badge>
              )}
            </div>
            {phase === "reveal" && playerMove && (
              <p className="text-sm text-emerald-200">
                You chose {playerMove}. Reveal before timer ends.
              </p>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </Card>

          {roundResult && (
            <RoundResult
              result={roundResult}
              opponent={opponent ?? undefined}
            />
          )}

          {isFinalChampion && (
            <Card className="border-amber-500 bg-amber-900/40 p-5 text-center shadow-lg">
              <div className="text-3xl">🏆 You are the Champion!</div>
              <div className="text-lg text-amber-100">+100 medals</div>
              <Button
                className="mt-4"
                onClick={() => router.push("/leaderboard")}
              >
                Go to Leaderboard
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm uppercase tracking-wide text-slate-400">
                Timers
              </h4>
              <Badge variant="default">Auto reveal</Badge>
            </div>
            {phase === "commit" ? (
              <Countdown
                total={COMMIT_DURATION}
                remaining={commitTimeLeft}
                label="Commit"
              />
            ) : (
              <Countdown
                total={REVEAL_DURATION}
                remaining={revealTimeLeft}
                label="Reveal"
              />
            )}
            <p className="text-xs text-slate-400">
              Auto reveal triggers when the reveal timer ends.
            </p>
          </Card>

          <Card className="space-y-3 p-4 sm:p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Tournament flow
              </h4>
              <Badge variant="secondary">Quick guide</Badge>
            </div>
            <Divider />
            <ul className="list-disc space-y-1 pl-4 text-slate-300">
              <li>Qualifiers: Best of 3 rounds.</li>
              <li>Finals: Best of 5 rounds.</li>
              <li>Odd player out? 10% lucky auto-pass each round.</li>
              <li>Commit window: 15s, Reveal window: 15s.</li>
              <li>Rounds advance automatically after results.</li>
            </ul>
          </Card>
        </div>
      </div>
    </BattleLayout>
  );
}

async function generateCommitment(move: Move, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${move}:${salt}`);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data[i];
    hash |= 0;
  }
  return `fallback_${Math.abs(hash)}`;
}

function randomSalt() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function shortAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
