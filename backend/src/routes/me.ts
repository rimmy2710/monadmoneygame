import { FastifyInstance } from "fastify";
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
  fastify.get("/me", async () => meProfile);
}
