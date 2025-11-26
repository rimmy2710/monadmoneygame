"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import BattleLayout from "../../../components/BattleLayout";
import Countdown from "../../../components/Countdown";
import RoundResult from "../../../components/RoundResult";
import RPSMoveButton from "../../../components/RPSMoveButton";
import { commitMove, fetchGameDetail, GameDetail, revealMove } from "../../../lib/api";

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
  const [roundResult, setRoundResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [commitTimeLeft, setCommitTimeLeft] = useState(COMMIT_DURATION);
  const [revealTimeLeft, setRevealTimeLeft] = useState(REVEAL_DURATION);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
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

  const loadGame = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGameDetail(gameId);
      setGame(data);
      setRoundNumber(data.round ?? data.currentRound ?? 1);
      setPhase(derivePhase(data));
      setOpponent(deriveOpponent(data, address));
      if (data.result) setRoundResult(data.result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load battle state");
    } finally {
      setLoading(false);
    }
  }, [address, deriveOpponent, derivePhase, gameId]);

  useEffect(() => {
    if (!gameId) return;
    void loadGame();
  }, [gameId, loadGame]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void loadGame();
    }, 3000);
    return () => clearInterval(id);
  }, [autoRefresh, loadGame]);

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

  useEffect(() => {
    if (phase === "reveal" && revealTimeLeft === 0 && playerMove && playerCommit && !autoRevealed) {
      setAutoRevealed(true);
      void handleReveal(true);
    }
  }, [autoRevealed, handleReveal, phase, playerCommit, playerMove, revealTimeLeft]);

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
      setError("Connect a wallet or enter an address to commit.");
      return;
    }
    if (!playerMove) {
      setError("Choose Rock, Paper, or Scissors first.");
      return;
    }
    const salt = commitSalt || randomSalt();
    setCommitSalt(salt);

    try {
      setError(null);
      const commitment = await generateCommitment(playerMove, salt);
      await commitMove(gameId, address, commitment);
      setPlayerCommit(commitment);
      setPhase("reveal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit move");
    }
  }, [address, commitSalt, gameId, playerMove]);

  const handleReveal = useCallback(
    async (auto?: boolean) => {
      if (!address || !playerMove || !commitSalt) {
        setError("Missing move or salt to reveal.");
        return;
      }
      try {
        setError(null);
        const response = await revealMove(gameId, address, playerMove, commitSalt);
        const nextResult =
          (response as { result?: "win" | "lose" | "draw" })?.result ?? roundResult ?? null;
        if (nextResult) setRoundResult(nextResult);
        setPhase("result");
        await loadGame();
        if (auto) {
          setAutoRevealed(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal move");
      }
    },
    [address, commitSalt, gameId, loadGame, playerMove, roundResult]
  );

  const shortAddr = useMemo(() => (address ? shortAddress(address) : ""), [address]);
  const opponentShort = useMemo(() => (opponent ? shortAddress(opponent) : "Waiting"), [opponent]);

  const totalRounds = useMemo(() => {
    if (game?.playersCount && game.playersCount <= 2) return 5;
    return 3;
  }, [game]);

  const isFinalChampion = useMemo(
    () => game?.status === "Finished" && (roundResult === "win" || game?.result === "win"),
    [game, roundResult]
  );

  return (
    <BattleLayout game={game} lastUpdated={lastUpdated}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="rounded-full bg-indigo-900/40 px-3 py-1 font-semibold text-indigo-100">Phase: {phase}</span>
          <span className="rounded-full bg-slate-900/60 px-3 py-1">Best of {totalRounds}</span>
          {game?.playersCount % 2 === 1 && (
            <span className="rounded-full bg-amber-900/50 px-3 py-1 text-amber-200">10% lucky auto-pass active</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (3s)
          </label>
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            onClick={() => loadGame()}
          >
            {loading ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-slate-400">You</p>
                <p className="text-xl font-semibold text-white">{shortAddr || "Not connected"}</p>
              </div>
              <div className="text-center text-sm text-slate-400">VS</div>
              <div className="space-y-1 text-right">
                <p className="text-sm uppercase tracking-wide text-slate-400">Opponent</p>
                <p className="text-xl font-semibold text-white">{opponent ? opponentShort : "Waiting for opponent"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Round {roundNumber}</h3>
              <span className="text-xs uppercase tracking-wide text-slate-400">{phase} phase</span>
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
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCommit}
                disabled={phase !== "commit" || !!playerCommit || loading}
              >
                {playerCommit ? "Committed" : "Commit Move"}
              </button>
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleReveal()}
                disabled={phase !== "reveal" || !playerCommit || !playerMove || loading}
              >
                Reveal Move
              </button>
              {playerMove && commitSalt && (
                <span className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
                  Salt: {commitSalt.slice(0, 6)}...{commitSalt.slice(-4)}
                </span>
              )}
            </div>
            {phase === "reveal" && playerMove && (
              <p className="text-sm text-emerald-200">You chose {playerMove}. Reveal before timer ends.</p>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>

          {roundResult && <RoundResult result={roundResult} opponent={opponent ?? undefined} />}

          {isFinalChampion && (
            <div className="rounded-xl border border-amber-500 bg-amber-900/40 p-5 text-center shadow-lg">
              <div className="text-3xl">🏆 You are the Champion!</div>
              <div className="text-lg text-amber-100">+100 medals</div>
              <button
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                onClick={() => router.push("/leaderboard")}
              >
                Go to Leaderboard
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-3">
            <h4 className="text-sm uppercase tracking-wide text-slate-400">Timers</h4>
            {phase === "commit" ? (
              <Countdown total={COMMIT_DURATION} remaining={commitTimeLeft} label="Commit" />
            ) : (
              <Countdown total={REVEAL_DURATION} remaining={revealTimeLeft} label="Reveal" />
            )}
            <p className="text-xs text-slate-400">Auto reveal triggers when the reveal timer ends.</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-2 text-sm text-slate-200">
            <h4 className="text-sm font-semibold text-white">Tournament flow</h4>
            <ul className="list-disc space-y-1 pl-4 text-slate-300">
              <li>Qualifiers: Best of 3 rounds.</li>
              <li>Finals: Best of 5 rounds.</li>
              <li>Odd player out? 10% lucky auto-pass each round.</li>
              <li>Commit window: 15s, Reveal window: 15s.</li>
              <li>Rounds advance automatically after results.</li>
            </ul>
          </div>
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
