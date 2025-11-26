import { FastifyInstance } from "fastify";
import { GameDetail, GameSummary, PlayerSnapshot } from "../types";

const mockGames: GameSummary[] = [
  {
    id: 0,
    status: "Ongoing",
    maxPlayers: 32,
    playersCount: 20,
    entryFee: "1.0",
    pool: "20.0",
    currentRound: 2,
  },
  {
    id: 1,
    status: "Pending",
    maxPlayers: 50,
    playersCount: 10,
    entryFee: "0.5",
    pool: "5.0",
    currentRound: 0,
  },
  {
    id: 2,
    status: "Finished",
    maxPlayers: 24,
    playersCount: 24,
    entryFee: "2.0",
    pool: "48.0",
    currentRound: 3,
  },
];

const mockPlayers: PlayerSnapshot[] = [
  { address: "0x1111111111111111111111111111111111111111", isActive: true, currentRound: 2 },
  { address: "0x2222222222222222222222222222222222222222", isActive: true, currentRound: 2 },
  { address: "0x3333333333333333333333333333333333333333", isActive: false, currentRound: 1 },
];

export default async function gamesRoutes(fastify: FastifyInstance) {
  fastify.get("/games", async () => mockGames);

  fastify.get("/games/:id", async (request) => {
    const { id } = request.params as { id: string };
    const gameId = Number(id);
    const summary = mockGames.find((g) => g.id === gameId) ?? mockGames[0];
    const detail: GameDetail = {
      ...summary,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      players: mockPlayers,
    };
    return detail;
  });
}
