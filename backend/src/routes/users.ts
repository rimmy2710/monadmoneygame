// backend/src/routes/users.ts
import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /me?address=0x...
 */
router.get("/me", async (req: Request, res: Response) => {
  const address = (req.query.address as string | undefined)?.toLowerCase();
  if (!address) {
    return res.status(400).json({ error: "Missing address" });
  }

  // TODO: query DB để lấy stats của user
  res.json({
    address,
    medals: 0,
    medalsPending: 0,
    medalsOnChain: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    activityTier: "Bronze",
    linkedSocials: { gmail: false, x: false, discord: false },
    referralCode: null,
    referredCount: 0,
  });
});

/**
 * GET /leaderboard
 */
router.get("/leaderboard", async (_req: Request, res: Response) => {
  // TODO: query DB để lấy top players theo medals / points
  res.json([]);
});

export default router;
