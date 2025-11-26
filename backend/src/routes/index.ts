import { FastifyInstance } from "fastify";
import gamesRoutes from "./games";
import healthRoutes from "./health";
import leaderboardRoutes from "./leaderboard";
import meRoutes from "./me";

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
  await fastify.register(gamesRoutes);
  await fastify.register(leaderboardRoutes);
  await fastify.register(meRoutes);
}
