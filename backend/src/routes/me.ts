import { FastifyInstance } from "fastify";
import { getMasterMindContract } from "../lib/monad";
import { getReferralStats } from "../store/referrals";
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

      const medalsOnChain = Number(medals);
      const medalsPending = r.pendingMedals;
      const totalMedals = medalsOnChain + medalsPending;

      const profile: MeProfile = {
        address,
        medals: totalMedals,
        medalsPending,
        medalsOnChain,
        gamesPlayed: Number(stats.gamesPlayed),
        gamesWon: Number(stats.gamesWon),
        activityTier: "Unknown",
        linkedSocials: { gmail: false, x: false, discord: false },
        referralCode: r.referralCode,
        referredCount: r.referredCount,
      };

      return reply.send(profile);
    } catch (err) {
      fastify.log.error(err);
      return reply.send(mockMe);
    }
  });
}
