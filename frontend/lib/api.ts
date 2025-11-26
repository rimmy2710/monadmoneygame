const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

type Social = "gmail" | "x" | "discord";

export interface GameSummary {
  id: number;
  status: string;
  maxPlayers: number;
  playersCount: number;
  entryFee: string;
  pool: string;
  currentRound: number;
  players?: string[];
}

export interface GameDetail extends GameSummary {
  phase?: "commit" | "reveal" | "result";
  round?: number;
  result?: "win" | "lose" | "draw";
}

export interface LeaderboardEntry {
  address: string;
  medals: number;
  gamesPlayed: number;
  gamesWon: number;
  referredCount: number;
  activityTier: string;
  linkedSocials: Record<Social, boolean>;
}

export interface MeProfile {
  address: string;
  medals: number;
  medalsPending: number;
  medalsOnChain: number;
  gamesPlayed: number;
  gamesWon: number;
  activityTier: string;
  linkedSocials: Record<Social, boolean>;
  referralCode: string | null;
  referredCount: number;
}

async function handleResponse<T>(res: Response, errorMessage: string): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || errorMessage);
  }
  return res.json();
}

export async function fetchMe(address: string): Promise<MeProfile> {
  const res = await fetch(`${API_BASE}/me?address=${encodeURIComponent(address)}`);
  return handleResponse<MeProfile>(res, "Failed to load profile");
}

export async function fetchGames(): Promise<GameSummary[]> {
  const res = await fetch(`${API_BASE}/games`);
  return handleResponse<GameSummary[]>(res, "Failed to load games");
}

export async function fetchGameDetail(id: number): Promise<GameDetail> {
  const res = await fetch(`${API_BASE}/games/${id}`);
  return handleResponse<GameDetail>(res, "Failed to load game");
}

export async function fetchLeaderboard(
  sortBy: string = "medals",
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({ sortBy, limit: String(limit) });
  const res = await fetch(`${API_BASE}/leaderboard?${params.toString()}`);
  return handleResponse<LeaderboardEntry[]>(res, "Failed to load leaderboard");
}

export async function fetchMyGames(address: string): Promise<GameSummary[]> {
  const games = await fetchGames();
  const normalized = address.trim().toLowerCase();

  if (!normalized) return [];

  return games.filter((game) => {
    const players = game.players ?? [];
    return players.some((player) => player.toLowerCase() === normalized);
  });
}

export async function commitMove(gameId: number, address: string, commitment: string) {
  const res = await fetch(`${API_BASE}/games/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, address, commitment }),
  });
  return handleResponse(res, "Failed to commit move");
}

export async function revealMove(gameId: number, address: string, move: string, salt: string) {
  const res = await fetch(`${API_BASE}/games/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, address, move, salt }),
  });
  return handleResponse(res, "Failed to reveal move");
}

export async function linkSocial(address: string, social: Social) {
  const res = await fetch(`${API_BASE}/social/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, social }),
  });
  return handleResponse(res, "Failed to link social");
}

export async function unlinkSocial(address: string, social: Social) {
  const res = await fetch(`${API_BASE}/social/unlink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, social }),
  });
  return handleResponse(res, "Failed to unlink social");
}

export async function createReferral(address: string) {
  const res = await fetch(`${API_BASE}/referral/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return handleResponse(res, "Failed to create referral");
}

export async function useReferral(referralCode: string, address: string) {
  const res = await fetch(`${API_BASE}/referral/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referralCode, address }),
  });
  return handleResponse(res, "Failed to use referral");
}

export async function claimPendingMedals(address: string) {
  const res = await fetch(`${API_BASE}/rewards/claim-medals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  return handleResponse(res, "Failed to claim medals");
}
