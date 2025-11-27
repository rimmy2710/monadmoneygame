// backend/src/routes/rooms.ts
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => { res.json([]); });
router.get("/:id", async (req: Request, res: Response) => { res.json({}); });

router.post("/public", async (req: Request, res: Response) => {
  res.status(201).json({ roomId: 1, txHash: "0xTODO" });
});

router.post("/creator", async (req: Request, res: Response) => {
  res.status(201).json({ roomId: 2, txHash: "0xTODO" });
});

router.post("/:id/join", async (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

router.post("/:id/start", async (req: Request, res: Response) => {
  res.status(200).json({ roomId: Number(req.params.id), txHash: "0xTODO" });
});

router.post("/:id/settle", async (req: Request, res: Response) => {
  res.status(200).json({ roomId: Number(req.params.id), txHash: "0xTODO" });
});

router.get("/:id/state", async (req: Request, res: Response) => {
  res.json({
    roomId: Number(req.params.id),
    status: "Started",
    currentRound: 1,
    maxRounds: 3,
    roundEndsAt: Date.now() + 15000,
    players: [],
  });
});

router.post("/:id/rounds/commit", async (req, res) => { res.json({ ok: true }); });
router.post("/:id/rounds/reveal", async (req, res) => { res.json({ ok: true }); });

export default router;
