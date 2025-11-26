## Environment variables

### Backend
- `MONAD_RPC_URL` – RPC endpoint URL.
- `CONTRACT_ADDRESS` – Master Mind contract address on Monad.
- `PORT` – backend port (default `4000`).
- `CORS_ORIGIN` – frontend origin allowed by CORS (e.g. `http://localhost:3000`).

### Frontend
- `NEXT_PUBLIC_BACKEND_URL` – URL of the backend API (e.g. `http://localhost:4000`).
- `NEXT_PUBLIC_CHAIN_ID` – chain id for the Monad network.
- `NEXT_PUBLIC_RPC_URL` – RPC endpoint used by wagmi/wallet connections.
- `NEXT_PUBLIC_MONAD_RPC_URL` – optional alias for the RPC URL used in the current frontend code.

## How to run locally

1. Clone the repository.
2. Install dependencies in both `backend/` and `frontend/` (e.g. `npm install` or `pnpm install`).
3. Copy the provided `.env.example` files to real `.env` / `.env.local` files and fill in real values for your Monad RPC URL and Master Mind contract address.
4. Start the backend (from `backend/`): `npm run dev` (defaults to port `4000` unless you override `PORT`).
5. Start the frontend (from `frontend/`): `npm run dev`.
6. Open the app in your browser at `http://localhost:3000`.

The app expects a live Monad RPC URL and a valid Master Mind contract address to function correctly.

## Quick Start

Run both backend and frontend together from the repository root:

1. Install dependencies in `backend/` and `frontend/` (for example, run `npm install` in each directory).
2. Install root-level tooling at the repo root (`npm install`) to pull in `concurrently` for the combined runner.
3. Copy environment templates (`backend/.env.example` and `frontend/.env.local.example`) to their runtime files with your Monad RPC URL and Master Mind contract address.
4. From the repository root, start both servers with `npm run dev:all` (backend on port `4000`, frontend on port `3000`).
5. Open `http://localhost:3000` while both services run side by side.

```bash
npm install      # installs root dependencies + concurrently
npm run dev:all  # starts backend + frontend concurrently
