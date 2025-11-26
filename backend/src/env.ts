import dotenv from "dotenv";

dotenv.config();

export const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "";
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
