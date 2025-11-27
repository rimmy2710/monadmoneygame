// backend/src/routes/rooms.ts
import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /rooms
 * List rooms (with filters: status, type, token...)
 */
router.get("/", async (req: Request, res: Response) => {
  // TODO: read query params: status, type, token...
  // TODO: query DB and/or contract to get room list
  res.json([]);
});

/**
 * GET /rooms/:id
 * Get room detail
 */
router.get("/:id", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  // TODO: load room detail, players, status...
  res.json({
    id: roomId,
    // ...
  });
});

/**
 * POST /rooms/public
 * Create public room (operator only)
 */
router.post("/public", async (req: Request, res: Response) => {
  // TODO: auth check: only operator/admin
  // TODO: read body: token, entryFee, minPlayers, maxPlayers
  // TODO: call MoneyGameRooms.createRoomPublic via ethers
  res.status(201).json({
    roomId: 1,
    txHash: "0xTODO",
  });
});

/**
 * POST /rooms/creator
 * Create creator room (NFT/Token holder or WL)
 */
router.post("/creator", async (req: Request, res: Response) => {
  // TODO: auth check by wallet / JWT / signature
  // TODO: verify _isCreator condition off-chain (or trust contract revert)
  // TODO: call MoneyGameRooms.createRoomCreator
  res.status(201).json({
    roomId: 2,
    txHash: "0xTODO",
  });
});

/**
 * POST /rooms/:id/join
 * Notify backend that user wants to join a room
 * (Frontend vẫn gọi joinRoom trên contract bằng wagmi)
 */
router.post("/:id/join", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  const { address, txHash } = req.body;
  // TODO:
  // - validate address, txHash
  // - save to DB: room_players(roomId, address, txHash)
  res.status(200).json({ ok: true });
});

/**
 * POST /rooms/:id/start
 * Start game (operator backend call)
 */
router.post("/:id/start", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  // TODO:
  // - call MoneyGameRooms.startGame(roomId)
  // - update DB: status = Started
  res.status(200).json({
    roomId,
    txHash: "0xTODO",
  });
});

/**
 * POST /rooms/:id/settle
 * Backend gửi Top1–Top4, contract chia thưởng
 */
router.post("/:id/settle", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  const { top1, top2, top3, top4 } = req.body;
  // TODO:
  // - validate addresses / họ có trong room không (off-chain)
  // - call MoneyGameRooms.settleGame(roomId, top1, top2, top3, top4)
  // - update DB: user_stats, leaderboard, room status
  res.status(200).json({
    roomId,
    txHash: "0xTODO",
  });
});

/**
 * GET /rooms/:id/state
 * State gameplay cho frontend (round hiện tại, points, timer...)
 */
router.get("/:id/state", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  // TODO:
  // - load from DB: currentRound, maxRounds, roundEndsAt, players, points...
  res.json({
    roomId,
    status: "Started",
    currentRound: 1,
    maxRounds: 3,
    roundEndsAt: Date.now() + 15000,
    players: [],
  });
});

/**
 * POST /rooms/:id/rounds/commit
 * User chọn move (ROCK/PAPER/SCISSORS)
 */
router.post("/:id/rounds/commit", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  const { address, round, move } = req.body;
  // TODO:
  // - validate input
  // - save move to DB with timestamp
  // - scheduler nội bộ sẽ xử lý auto-random nếu hết 15s mà không có move
  res.status(200).json({ ok: true });
});

/**
 * POST /rooms/:id/rounds/reveal
 * (V1 có thể chỉ là "confirm" vì backend giữ move; đặt route để future-proof)
 */
router.post("/:id/rounds/reveal", async (req: Request, res: Response) => {
  const roomId = Number(req.params.id);
  const { address, round } = req.body;
  // TODO: đánh dấu user "ready" cho round đó
  res.status(200).json({ ok: true });
});

export default router;
