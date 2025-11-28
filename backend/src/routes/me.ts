import { FastifyInstance } from "fastify";
import { getMasterMindContract } from "../lib/monad";
import { MeProfile } from "../types";

const meProfile: MeProfile = {
  address: "0xMockUser",
  medals: 120,
  gamesPlayed: 8,
  gamesWon: 3,
  activityTier: "Silver",
  linkedSocials: {
    gmail: false,
    x: true,
    discord: false,
  },
  referralCode: "REF-MOCK-123",
  referredCount: 5,
};

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.get("/me", async (request) => {
    const query = request.query as { address?: string };
    const address = query.address;
    const mm = getMasterMindContract();

    if (!mm || !address) return meProfile;

    try {
      const [stats, medals] = await Promise.all([
        mm.contract.userStats(address),
        mm.contract.medals(address),
      ]);

      return {
        address,
        medals: Number(medals),
        gamesPlayed: Number((stats as any).gamesPlayed ?? (stats as any)[0] ?? 0),
        gamesWon: Number((stats as any).gamesWon ?? (stats as any)[1] ?? 0),
        activityTier: "Unknown",
        linkedSocials: { gmail: false, x: false, discord: false },
        referralCode: null,
        referredCount: 0,
      } satisfies MeProfile;
    } catch (err) {
      fastify.log.error({ err }, "failed to fetch me profile from chain");
      return meProfile;
    }
  });
}
