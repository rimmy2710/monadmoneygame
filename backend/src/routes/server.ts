import Fastify from "fastify";
import roomsRoutes from "./routes/rooms";

const fastify = Fastify({ logger: true });

fastify.register(roomsRoutes);

fastify.get("/health", async () => ({ ok: true }));

fastify.listen({ port: 4000, host: "0.0.0.0" });
