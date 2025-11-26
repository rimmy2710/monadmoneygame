import Fastify from "fastify";
import { config } from "./config/env";
import registerRoutes from "./routes";

async function buildServer() {
  const app = Fastify({ logger: true });
  await registerRoutes(app);
  return app;
}

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: config.port, host: "0.0.0.0" });
    server.log.info(`Master Mind backend listening on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
