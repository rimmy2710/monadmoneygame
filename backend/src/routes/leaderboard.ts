import type { FastifyInstance } from "fastify";
import { buildLeaderboard, type LeaderboardSortBy } from "../lib/leaderboard";

export default async function leaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboard", async (request, reply) => {
    const { sortBy, limit } = request.query as {
      sortBy?: LeaderboardSortBy;
      limit?: string;
    };

    const sortParam: LeaderboardSortBy =
      sortBy === "games" || sortBy === "referrals" ? sortBy : "medals";
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 100, 200) : 100;

    try {
      const entries = await buildLeaderboard(sortParam, limitNum);
      return reply.send(entries);
    } catch (err) {
      app.log.error(err);
      return reply.send([]);
    }
  });
}
