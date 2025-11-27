// backend/src/routes/meta.ts
import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /dev/status
 */
router.get("/dev/status", async (_req: Request, res: Response) => {
  // TODO:
  // - check DB connection
  // - check RPC Monad (simple JSON-RPC call)
  // - maybe read roomsContract address from config
  const backendHealthy = true;
  const monadRpcReachable = true;

  res.json({
    backendHealthy,
    monadRpcReachable,
    roomsContract: process.env.ROOMS_CONTRACT_ADDRESS ?? null,
    version: process.env.APP_VERSION ?? "v1.0.0",
  });
});

export default router;
