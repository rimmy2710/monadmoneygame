import { FastifyInstance } from "fastify";
import { getMasterMindContract } from "../lib/monad";
import { MeProfile } from "../types";

const mockMe: MeProfile = {
  address: null,
  medals: 0,
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

      const profile: MeProfile = {
        address,
        medals: Number(medals),
        gamesPlayed: Number(stats.gamesPlayed),
        gamesWon: Number(stats.gamesWon),
        activityTier: "Unknown",
        linkedSocials: { gmail: false, x: false, discord: false },
        referralCode: null,
        referredCount: 0,
      };

      return reply.send(profile);
    } catch (err) {
      fastify.log.error(err);
      return reply.send(mockMe);
    }
  });
}
