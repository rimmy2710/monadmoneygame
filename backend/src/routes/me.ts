import { FastifyInstance } from "fastify";
import { getMasterMindContract } from "../lib/monad";
import { getReferralStats } from "../store/referrals";
import { getSocials } from "../store/socials";
import { computeActivityTier } from "../lib/activity";
import { registerPlayer } from "../store/players";
import { MeProfile } from "../types";

const mockMe: MeProfile = {
  address: "",
  medals: 0,
  medalsPending: 0,
  medalsOnChain: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  activityTier: "Bronze",
  linkedSocials: { gmail: false, x: false, discord: false },
  referralCode: null,
  referredCount: 0,
};

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.get("/me", async (request, reply) => {
    const address = (request.query as any).address as string | undefined;

    const mm = getMasterMindContract();
    if (!address || !mm) {
      return reply.send(mockMe);
    }

    try {
      const [stats, medals] = (await Promise.all([
        mm.contract.userStats(address),
        mm.contract.medals(address),
      ])) as [any, any];

      const r = getReferralStats(address);
      const socials = getSocials(address);

      const medalsOnChain = Number(medals);
      const medalsPending = r.pendingMedals;
      const totalMedals = medalsOnChain + medalsPending;

      const activityTier = computeActivityTier({
        medals: totalMedals,
        gamesPlayed: Number(stats.gamesPlayed),
        referredCount: r.referredCount,
        socials,
      });

      const profile: MeProfile = {
        address,
        medals: totalMedals,
        medalsPending,
        medalsOnChain,
        gamesPlayed: Number(stats.gamesPlayed),
        gamesWon: Number(stats.gamesWon),
        activityTier,
        linkedSocials: socials,
        referralCode: r.referralCode,
        referredCount: r.referredCount,
      };

      // track known player for leaderboard
      registerPlayer(address);

      return reply.send(profile);
    } catch (err) {
      fastify.log.error(err);
      return reply.send(mockMe);
    }
  });
}
