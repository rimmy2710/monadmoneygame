import { ethers } from "ethers";
import { config } from "../config/env";

const MASTER_MIND_ABI = [
  "function nextGameId() view returns (uint256)",
  "function games(uint256) view returns (uint256 id, uint256 entryFee, uint16 maxPlayers, uint8 status, uint8 currentRound, uint16 playersCount, uint256 pool)",
  "function userStats(address) view returns (uint32 gamesPlayed, uint32 gamesWon)",
  "function medals(address) view returns (uint256)",
];

function getProvider(): ethers.JsonRpcProvider | null {
  if (!config.monadRpcUrl) return null;
  return new ethers.JsonRpcProvider(config.monadRpcUrl);
}

export function getMasterMindContract():
  | { provider: ethers.JsonRpcProvider; contract: ethers.Contract }
  | null {
  const provider = getProvider();
  if (!provider || !config.masterMindContract) return null;

  const contract = new ethers.Contract(
    config.masterMindContract,
    MASTER_MIND_ABI,
    provider
  );

  return { provider, contract };
}

export function formatUsdc(value: bigint | number) {
  return ethers.formatUnits(value, 6);
}
