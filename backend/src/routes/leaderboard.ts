import { FastifyInstance } from "fastify";
import { LeaderboardEntry } from "../types";

const leaderboard: LeaderboardEntry[] = [
  { address: "0x1111111111111111111111111111111111111111", medals: 500, gamesPlayed: 20, gamesWon: 10 },
  { address: "0x2222222222222222222222222222222222222222", medals: 300, gamesPlayed: 15, gamesWon: 7 },
  { address: "0x3333333333333333333333333333333333333333", medals: 200, gamesPlayed: 12, gamesWon: 5 },
];

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get("/leaderboard", async () => leaderboard);
}
