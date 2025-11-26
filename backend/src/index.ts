import Fastify from "fastify";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, MONAD_RPC_URL } from "./env";
import gamesRoutes from "./routes/games";
import healthRoutes from "./routes/health";
import leaderboardRoutes from "./routes/leaderboard";
import meRoutes from "./routes/me";
import referralRoutes from "./routes/referral";
import rewardsRoutes from "./routes/rewards";

const server = Fastify({ logger: true });

const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
const contractAddress = CONTRACT_ADDRESS;

server.decorate("monad", { provider, contractAddress });

server.register(healthRoutes);
server.register(gamesRoutes);
server.register(leaderboardRoutes);
server.register(meRoutes);
server.register(referralRoutes, { prefix: "/referral" });
server.register(rewardsRoutes, { prefix: "/rewards" });

const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    server.log.info("Server listening on port 3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
