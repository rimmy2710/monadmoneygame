import { FastifyInstance } from "fastify";

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.get("/me", async () => ({ profile: null }));
}
