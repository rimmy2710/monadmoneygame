import type { GameStatusText } from "./lib/monad";

export interface GameSummary {
  id: number;
  status: GameStatusText;
  maxPlayers: number;
  playersCount: number;
  entryFee: string;
  pool: string;
  currentRound: number;
}

export interface GamePlayer {
  address: string;
  joinedAt: string | null;
}

export interface GameDetail extends GameSummary {
  createdAt: string | null;
  updatedAt: string | null;
  players: GamePlayer[];
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

export interface ReferralStats {
  address: string;
  referralCode: string | null;
  referredCount: number;
  pendingMedals: number;
}

export interface ReferralUseResult {
  ok: boolean;
  reason?: string;
  referrer?: string;
  newUser?: string;
  referrerPendingMedals?: number;
  newUserPendingMedals?: number;
}

export interface LeaderboardEntry {
  address: string;
  medals: number;
  medalsPending: number;
  medalsOnChain: number;
  gamesPlayed: number;
  gamesWon: number;
  activityTier: string;
  referredCount: number;
  linkedSocials: {
    gmail: boolean;
    x: boolean;
    discord: boolean;
  };
}
