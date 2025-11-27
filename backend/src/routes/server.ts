// backend/src/server.ts
import express from "express";
import cors from "cors";
import roomsRouter from "./routes/rooms";
import usersRouter from "./routes/users";
import metaRouter from "./routes/meta";

const app = express();

app.use(cors());
app.use(express.json());

// health check đơn giản
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// routes chính
app.use("/rooms", roomsRouter);
app.use("/", usersRouter);   // /me, /leaderboard
app.use("/", metaRouter);    // /dev/status

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
