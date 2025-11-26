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
  medals: number;          // total = on-chain + pending
  medalsPending: number;   // off-chain pending medals
  medalsOnChain: number;   // value read from contract
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

