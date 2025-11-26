import { FastifyInstance } from "fastify";
import { getMasterMindContract, formatUsdc } from "../lib/monad";
import { GameDetail, GameStatus, GameSummary, PlayerSnapshot } from "../types";

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

function mapStatus(status: number): GameStatus {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Ongoing";
    case 2:
      return "Finished";
    case 3:
      return "Cancelled";
    default:
      return "Pending";
  }
}

function mapGameSummary(id: number, raw: any): GameSummary {
  return {
    id,
    status: mapStatus(Number(raw.status ?? raw[3] ?? 0)),
    maxPlayers: Number(raw.maxPlayers ?? raw[2] ?? 0),
    playersCount: Number(raw.playersCount ?? raw[5] ?? 0),
    entryFee: formatUsdc(raw.entryFee ?? raw[1] ?? 0n),
    pool: formatUsdc(raw.pool ?? raw[6] ?? 0n),
    currentRound: Number(raw.currentRound ?? raw[4] ?? 0),
  };
}

export default async function gamesRoutes(fastify: FastifyInstance) {
  fastify.get("/games", async (_, reply) => {
    const mm = getMasterMindContract();
    if (!mm) return mockGames;

    try {
      const nextGameId = await mm.contract.nextGameId();
      const latest = Number(nextGameId);
      const startId = Math.max(0, latest - 3);
      const summaries: GameSummary[] = [];

      for (let id = startId; id < latest; id++) {
        const rawGame = await mm.contract.games(id);
        summaries.push(mapGameSummary(id, rawGame));
      }

      return summaries;
    } catch (err) {
      fastify.log.error({ err }, "failed to fetch games from chain");
      return mockGames;
    }
  });

  fastify.get("/games/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const gameId = Number(id);
    const mm = getMasterMindContract();

    if (!mm) {
      const summary = mockGames.find((g) => g.id === gameId) ?? mockGames[0];
      const detail: GameDetail = {
        ...summary,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        players: mockPlayers,
      };
      return detail;
    }

    try {
      const rawGame = await mm.contract.games(gameId);
      const summary = mapGameSummary(gameId, rawGame);
      const detail: GameDetail = {
        ...summary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        players: [],
      };
      return detail;
    } catch (err) {
      fastify.log.error({ err }, "failed to fetch game detail from chain");
      const summary = mockGames.find((g) => g.id === gameId) ?? mockGames[0];
      const detail: GameDetail = {
        ...summary,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        players: mockPlayers,
      };
      return detail;
    }
  });
}
