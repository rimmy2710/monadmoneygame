// frontend/lib/types.ts

export type RoomStatus = "Waiting" | "Ready" | "Started" | "Settled" | "Cancelled";
export type RoomType = "Public" | "Creator";

export interface RoomSummary {
  id: number;
  roomType: RoomType;
  status: RoomStatus;
  token: "MON" | "USDC";
  entryFee: string;        // giữ dạng string cho số lớn
  minPlayers: number;
  maxPlayers: number;
  playersCount: number;
  createdAt?: string;
  startedAt?: string | null;
}

export interface RoomDetail extends RoomSummary {
  players: string[];
  endedAt?: string | null;
}

export interface RoomStatePlayer {
  address: string;
  points: number;
  contributionScore: number;
}

export interface RoomState {
  roomId: number;
  status: RoomStatus;
  currentRound: number;
  maxRounds: number;
  roundEndsAt: number; // timestamp ms
  players: RoomStatePlayer[];
}

export interface MeProfile {
  address: string;
  medals: number;
  medalsPending: number;
  medalsOnChain: number;
  gamesPlayed: number;
  gamesWon: number;
  activityTier: string;
  linkedSocials: {
    gmail: boolean;
    x: boolean;
    discord: boolean;
  };
  referralCode: string | null;
  referredCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  medals: number;
  gamesWon: number;
  referrals: number;
}

export interface DevStatus {
  backendHealthy: boolean;
  monadRpcReachable: boolean;
  roomsContract: string | null;
  version: string;
}
