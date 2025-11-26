import type { SocialState } from "../store/socials";

export type ActivityTier = "Bronze" | "Silver" | "Gold" | "Diamond";

export function computeActivityTier(params: {
  medals: number;
  gamesPlayed: number;
  referredCount: number;
  socials: SocialState;
}): ActivityTier {
  const { medals, gamesPlayed, referredCount, socials } = params;

  const socialScore =
    (socials.gmail ? 1 : 0) +
    (socials.x ? 1 : 0) +
    (socials.discord ? 1 : 0);

  let score = 0;
  score += Math.min(medals / 50, 40);
  score += Math.min(gamesPlayed * 2, 30);
  score += Math.min(referredCount * 5, 20);
  score += socialScore * 3;

  if (score >= 70) return "Diamond";
  if (score >= 45) return "Gold";
  if (score >= 20) return "Silver";
  return "Bronze";
}
