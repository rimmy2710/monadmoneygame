import { FastifyInstance } from "fastify";

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get("/leaderboard", async () => ({ players: [] }));
}
