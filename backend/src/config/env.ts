import dotenv from "dotenv";

dotenv.config();

export const config = {
  monadRpcUrl: process.env.MONAD_RPC_URL ?? "",
  masterMindContract: process.env.MASTER_MIND_CONTRACT ?? "",
  port: Number(process.env.PORT ?? 4000),
};

export type AppConfig = typeof config;
