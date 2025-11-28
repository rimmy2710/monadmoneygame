"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { fetchMe, fetchRooms } from "../../lib/api";
import type { MeProfile, RoomSummary } from "../../lib/types";

export default function LobbyPage() {
  const router = useRouter();
  const { address } = useAccount();

  const [me, setMe] = useState<MeProfile | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadData() {
      try {
        setError(null);
        setLoading(true);

        if (address) {
          const meRes = await fetchMe(address);
          setMe(meRes);
        } else {
          setMe(null);
        }

        // lấy các room đang Waiting/Ready – tuỳ backend implement filter
        const roomList = await fetchRooms({ status: "Waiting" });
        setRooms(roomList);
      } catch (e: any) {
        setError(e.message || "Failed to load lobby");
      } finally {
        setLoading(false);
      }
    }

    loadData();
    interval = setInterval(loadData, 10000); // refresh 10s

    return () => clearInterval(interval);
  }, [address]);

  const handleEnterRoom = (roomId: number) => {
    router.push(`/battle/${roomId}`);
  };

  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <h1>Lobby</h1>

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Your stats</h2>
        {!address && <p>Connect wallet to see your stats.</p>}
        {address && !me && <p>Loading profile...</p>}
        {me && (
          <ul>
            <li>Address: {me.address}</li>
            <li>Medals: {me.medals}</li>
            <li>Games played: {me.gamesPlayed}</li>
            <li>Games won: {me.gamesWon}</li>
          </ul>
        )}
      </section>

      <section>
        <h2>Available Rooms</h2>

        {loading && <p>Loading rooms...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {!loading && !error && rooms.length === 0 && (
          <p>No rooms available. Please wait for new rooms.</p>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {rooms.map((room) => (
            <li
              key={room.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div>
                  <strong>Room #{room.id}</strong> – {room.roomType} – {room.status}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {room.playersCount}/{room.maxPlayers} players · Token {room.token} · Fee{" "}
                  {room.entryFee}
                </div>
              </div>
              <button onClick={() => handleEnterRoom(room.id)}>Enter</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
