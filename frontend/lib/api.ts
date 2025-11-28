// frontend/lib/api.ts
import type {
  RoomSummary,
  RoomDetail,
  RoomState,
  MeProfile,
  LeaderboardEntry,
  DevStatus,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_BACKEND_URL is not set");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if ((data as any)?.error) message = (data as any).error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

// ---------- Rooms ----------

export async function fetchRooms(params?: {
  status?: string;
  type?: string;
  token?: string;
}): Promise<RoomSummary[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.token) query.set("token", params.token);

  const qs = query.toString();
  const path = qs ? `/rooms?${qs}` : "/rooms";

  return apiFetch<RoomSummary[]>(path);
}

export async function fetchRoomDetail(id: number): Promise<RoomDetail> {
  return apiFetch<RoomDetail>(`/rooms/${id}`);
}

export async function fetchRoomState(id: number): Promise<RoomState> {
  return apiFetch<RoomState>(`/rooms/${id}/state`);
}

export async function joinRoom(id: number, address: string, txHash: string) {
  return apiFetch<{ ok: boolean }>(`/rooms/${id}/join`, {
    method: "POST",
    body: JSON.stringify({ address, txHash }),
  });
}

export async function commitMove(params: {
  roomId: number;
  address: string;
  round: number;
  move: "ROCK" | "PAPER" | "SCISSORS";
}) {
  const { roomId, ...body } = params;
  return apiFetch<{ ok: boolean }>(`/rooms/${roomId}/rounds/commit`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function revealMove(params: {
  roomId: number;
  address: string;
  round: number;
}) {
  const { roomId, ...body } = params;
  return apiFetch<{ ok: boolean }>(`/rooms/${roomId}/rounds/reveal`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---------- User & Leaderboard ----------

export async function fetchMe(address: string): Promise<MeProfile> {
  const query = new URLSearchParams({ address });
  return apiFetch<MeProfile>(`/me?${query.toString()}`);
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>("/leaderboard");
}

// ---------- Dev / Meta ----------

export async function fetchDevStatus(): Promise<DevStatus> {
  return apiFetch<DevStatus>("/dev/status");
}
