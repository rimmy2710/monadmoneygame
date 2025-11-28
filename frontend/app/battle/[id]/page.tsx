"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { fetchRoomDetail, fetchRoomState, commitMove } from "../../../lib/api";
import type { RoomDetail, RoomState } from "../../../lib/types";

export default function BattlePage() {
  const params = useParams();
  const roomId = Number(params?.id);

  const { address } = useAccount();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] =
    useState<"ROCK" | "PAPER" | "SCISSORS" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!roomId) return;
    try {
      setError(null);
      setLoading(true);
      const [roomRes, stateRes] = await Promise.all([
        fetchRoomDetail(roomId),
        fetchRoomState(roomId),
      ]);
      setRoom(roomRes);
      setState(stateRes);
    } catch (e: any) {
      setError(e.message || "Failed to load battle");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    loadData();
    const interval = setInterval(loadData, 5000); // poll 5s
    return () => clearInterval(interval);
  }, [roomId, loadData]);

  const handleCommit = async () => {
    if (!address || !state || !selectedMove) return;
    try {
      setSubmitting(true);
      await commitMove({
        roomId,
        address,
        round: state.currentRound,
        move: selectedMove,
      });
      setSelectedMove(null);
      await loadData();
    } catch (e: any) {
      alert(e.message || "Commit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!roomId || Number.isNaN(roomId)) {
    return <div style={{ padding: 24 }}>Invalid room id.</div>;
  }

  if (loading && !room) {
    return <div style={{ padding: 24 }}>Loading battle...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (!room || !state) {
    return <div style={{ padding: 24 }}>Room not found.</div>;
  }

  const now = Date.now();
  const timeLeftMs = Math.max(0, state.roundEndsAt - now);
  const timeLeftSec = Math.floor(timeLeftMs / 1000);

  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <h1>Battle – Room #{room.id}</h1>
      <p>
        Status: {state.status} – Round {state.currentRound}/{state.maxRounds}
      </p>
      <p>
        Players: {room.players.length} / {room.maxPlayers}
      </p>
      <p>Time left this phase: {timeLeftSec}s</p>

      <section style={{ marginTop: 24 }}>
        <h2>Your move</h2>
        {!address && <p>Please connect wallet to play.</p>}

        {address && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button
                onClick={() => setSelectedMove("ROCK")}
                disabled={state.status !== "Started" || submitting}
              >
                Rock
              </button>
              <button
                onClick={() => setSelectedMove("PAPER")}
                disabled={state.status !== "Started" || submitting}
              >
                Paper
              </button>
              <button
                onClick={() => setSelectedMove("SCISSORS")}
                disabled={state.status !== "Started" || submitting}
              >
                Scissors
              </button>
            </div>
            <p>Selected: {selectedMove ?? "None"}</p>
            <button
              onClick={handleCommit}
              disabled={!selectedMove || submitting || state.status !== "Started"}
            >
              {submitting ? "Submitting..." : "Commit move"}
            </button>
          </>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Scoreboard</h2>
        <ul>
          {state.players.map((p) => (
            <li key={p.address}>
              {p.address} – points: {p.points} – contribution: {p.contributionScore}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
