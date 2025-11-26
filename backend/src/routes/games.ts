import { FastifyInstance } from "fastify";

export default async function gamesRoutes(fastify: FastifyInstance) {
  fastify.get("/games", async () => {
    return { games: [] };
  });

  fastify.get("/games/:id", async (request) => {
    const { id } = request.params as { id: string };
    return { id, game: null };
  });

  fastify.post("/join", async () => {
    return { success: true };
  });
}
