// backend/src/routes/rooms.ts
import { FastifyInstance } from "fastify";

export default async function roomsRoutes(fastify: FastifyInstance) {

  fastify.get("/rooms", async (request, reply) => {
    return [];
  });

  fastify.get("/rooms/:id", async (request, reply) => {
    return { id: request.params.id };
  });

  fastify.post("/rooms/public", async (request, reply) => {
    return { roomId: 1, txHash: "0xTODO" };
  });

  fastify.post("/rooms/creator", async (request, reply) => {
    return { roomId: 2, txHash: "0xTODO" };
  });

  fastify.post("/rooms/:id/join", async (request, reply) => {
    return { ok: true };
  });

  fastify.post("/rooms/:id/start", async (request, reply) => {
    return { roomId: request.params.id, txHash: "0xTODO" };
  });

  fastify.post("/rooms/:id/settle", async (request, reply) => {
    return { roomId: request.params.id, txHash: "0xTODO" };
  });

  fastify.get("/rooms/:id/state", async (request, reply) => {
    return {
      roomId: request.params.id,
      status: "Started",
      currentRound: 1,
      maxRounds: 3,
      roundEndsAt: Date.now() + 15000,
      players: [],
    };
  });

  fastify.post("/rooms/:id/rounds/commit", async (request, reply) => {
    return { ok: true };
  });

  fastify.post("/rooms/:id/rounds/reveal", async (request, reply) => {
    return { ok: true };
  });
}
