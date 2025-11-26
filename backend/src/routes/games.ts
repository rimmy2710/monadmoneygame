import { FastifyInstance } from "fastify";
import { formatUsdc, getMasterMindContract, mapStatus } from "../lib/monad";
import { GameDetail, GameSummary } from "../types";

const mockGames: GameSummary[] = [
  {
    id: 0,
    status: "Pending",
    maxPlayers: 4,
    playersCount: 2,
    entryFee: "10.0",
    pool: "20.0",
    currentRound: 1,
  },
  {
    id: 1,
    status: "Ongoing",
    maxPlayers: 6,
    playersCount: 4,
    entryFee: "5.0",
    pool: "30.0",
    currentRound: 2,
  },
  {
    id: 2,
    status: "Finished",
    maxPlayers: 8,
    playersCount: 8,
    entryFee: "2.5",
    pool: "20.0",
    currentRound: 3,
  },
];

function mockGameDetailFor(id: number): GameDetail {
  const base = mockGames.find((g) => g.id === id);

  return {
    id: base?.id ?? id,
    status: base?.status ?? "Pending",
    maxPlayers: base?.maxPlayers ?? 4,
    playersCount: base?.playersCount ?? 0,
    entryFee: base?.entryFee ?? "0",
    pool: base?.pool ?? "0",
    currentRound: base?.currentRound ?? 1,
    createdAt: null,
    updatedAt: null,
    players: [],
  };
}

export default async function gamesRoutes(fastify: FastifyInstance) {
  fastify.get("/games", async (_request, reply) => {
    const mm = getMasterMindContract();
    if (!mm) {
      return reply.send(mockGames);
    }

    try {
      const nextGameId = (await mm.contract.nextGameId()) as bigint;
      const latest = Number(nextGameId);
      const startId = Math.max(0, latest - 3);

      const results: GameSummary[] = [];

      for (let id = startId; id < latest; id++) {
        const g = (await mm.contract.games(id)) as any;

        const entryFee = formatUsdc(g.entryFee as bigint);
        const pool = formatUsdc(g.pool as bigint);
        const statusText = mapStatus(Number(g.status));

        results.push({
          id,
          status: statusText,
          maxPlayers: Number(g.maxPlayers),
          playersCount: Number(g.playersCount),
          entryFee,
          pool,
          currentRound: Number(g.currentRound),
        });
      }

      return reply.send(results);
    } catch (err) {
      fastify.log.error(err);
      return reply.send(mockGames);
    }
  });

  fastify.get("/games/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const gameId = Number(id);

    const mm = getMasterMindContract();
    if (!mm) {
      return reply.send(mockGameDetailFor(gameId));
    }

    try {
      const g = (await mm.contract.games(gameId)) as any;
      const detail: GameDetail = {
        id: gameId,
        status: mapStatus(Number(g.status)),
        maxPlayers: Number(g.maxPlayers),
        playersCount: Number(g.playersCount),
        entryFee: formatUsdc(g.entryFee as bigint),
        pool: formatUsdc(g.pool as bigint),
        currentRound: Number(g.currentRound),
        createdAt: null,
        updatedAt: null,
        players: [],
      };
      return reply.send(detail);
    } catch (err) {
      fastify.log.error(err);
      return reply.send(mockGameDetailFor(gameId));
    }
  });

  fastify.post("/join", async () => {
    return { success: true };
  });
}
