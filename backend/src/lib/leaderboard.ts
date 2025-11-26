import { getMasterMindContract } from "./monad";
import { getKnownPlayers } from "../store/players";
import { getReferralStats } from "../store/referrals";
import { getSocials } from "../store/socials";
import { computeActivityTier } from "./activity";
import type { LeaderboardEntry } from "../types";

export type LeaderboardSortBy = "medals" | "games" | "referrals";

export async function buildLeaderboard(
  sortBy: LeaderboardSortBy = "medals",
  limit = 100
): Promise<LeaderboardEntry[]> {
  const mm = getMasterMindContract();
  const addresses = getKnownPlayers();
  if (!mm || addresses.length === 0) {
    return [];
  }

  const entries: LeaderboardEntry[] = [];

  for (const address of addresses) {
    try {
      const [stats, medals] = await Promise.all([
        mm.contract.userStats(address),
        mm.contract.medals(address),
      ]);

      const r = getReferralStats(address);
      const socials = getSocials(address);

      const medalsOnChain = Number(medals);
      const medalsPending = r.pendingMedals;
      const totalMedals = medalsOnChain + medalsPending;
      const gamesPlayed = Number(stats.gamesPlayed);
      const gamesWon = Number(stats.gamesWon);

      const activityTier = computeActivityTier({
        medals: totalMedals,
        gamesPlayed,
        referredCount: r.referredCount,
        socials,
      });

      entries.push({
        address,
        medals: totalMedals,
        medalsOnChain,
        medalsPending,
        gamesPlayed,
        gamesWon,
        activityTier,
        referredCount: r.referredCount,
        linkedSocials: socials,
      });
    } catch {
      continue;
    }
  }

  entries.sort((a, b) => {
    if (sortBy === "games") {
      return b.gamesPlayed - a.gamesPlayed || b.medals - a.medals;
    }
    if (sortBy === "referrals") {
      return b.referredCount - a.referredCount || b.medals - a.medals;
    }
    return b.medals - a.medals;
  });

  return entries.slice(0, limit);
}
