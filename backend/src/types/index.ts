export type GameStatus = "Pending" | "Ongoing" | "Finished" | "Cancelled";

export interface GameSummary {
  id: number;
  status: GameStatus;
  maxPlayers: number;
  playersCount: number;
  entryFee: string;
  pool: string;
  currentRound: number;
}

export interface PlayerSnapshot {
  address: string;
  isActive: boolean;
  currentRound: number;
}

export interface GameDetail extends GameSummary {
  createdAt: string;
  updatedAt: string;
  players: PlayerSnapshot[];
}

export type ActivityTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Unknown";

export interface LeaderboardEntry {
  address: string;
  medals: number;
  gamesPlayed: number;
  gamesWon: number;
}

export interface MeProfile {
  address: string;
  medals: number;
  gamesPlayed: number;
  gamesWon: number;
  activityTier: ActivityTier;
  linkedSocials: {
    gmail: boolean;
    x: boolean;
    discord: boolean;
  };
  referralCode: string | null;
  referredCount: number;
}
