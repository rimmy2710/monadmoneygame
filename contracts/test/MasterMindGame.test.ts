import { expect } from "chai";
import { ethers } from "hardhat";

const ROCK = 1;
const PAPER = 2;

describe("MasterMindGame", () => {
  let admin: any;
  let player1: any;
  let player2: any;
  let masterMind: any;
  let usdc: any;
  let nft: any;

  beforeEach(async () => {
    [admin, player1, player2] = await ethers.getSigners();

    const Usdc = await ethers.getContractFactory("MockUSDC");
    usdc = await Usdc.deploy();

    const Nft = await ethers.getContractFactory("MockMasterMindNFT");
    nft = await Nft.deploy();

    const MasterMind = await ethers.getContractFactory("MasterMindGame");
    masterMind = await MasterMind.deploy(await usdc.getAddress(), await nft.getAddress(), 1000);
  });

  it("allows users to deposit and withdraw from the vault", async () => {
    const depositAmount = ethers.parseUnits("100", 6);
    const withdrawAmount = ethers.parseUnits("40", 6);

    await usdc.transfer(player1.address, depositAmount);
    await usdc.connect(player1).approve(await masterMind.getAddress(), depositAmount);

    await expect(masterMind.connect(player1).depositUSDC(depositAmount))
      .to.emit(masterMind, "Deposited")
      .withArgs(player1.address, depositAmount);

    const vaultAfterDeposit = await masterMind.userVaults(player1.address);
    expect(vaultAfterDeposit.usdcBalance).to.equal(depositAmount);

    await expect(masterMind.connect(player1).withdrawUSDC(withdrawAmount))
      .to.emit(masterMind, "Withdrawn")
      .withArgs(player1.address, withdrawAmount);

    const vaultAfterWithdraw = await masterMind.userVaults(player1.address);
    expect(vaultAfterWithdraw.usdcBalance).to.equal(depositAmount - withdrawAmount);

    const playerBalance = await usdc.balanceOf(player1.address);
    expect(playerBalance).to.equal(withdrawAmount);
  });

  it("admin can create a game and players can join using vault balances", async () => {
    const entryFee = ethers.parseUnits("10", 6);
    await masterMind.connect(admin).createGame(2, entryFee);

    const game = await masterMind.games(0);
    expect(game.maxPlayers).to.equal(2);
    expect(game.entryFee).to.equal(entryFee);
    expect(game.status).to.equal(0); // Pending

    const depositAmount = ethers.parseUnits("20", 6);

    for (const player of [player1, player2]) {
      await usdc.transfer(player.address, depositAmount);
      await usdc.connect(player).approve(await masterMind.getAddress(), depositAmount);
      await masterMind.connect(player).depositUSDC(depositAmount);
      await masterMind.connect(player).joinGame(0);
    }

    const updatedGame = await masterMind.games(0);
    expect(updatedGame.playersCount).to.equal(2);
    expect(updatedGame.pool).to.equal(entryFee * 2n);
    expect(updatedGame.status).to.equal(1); // Ongoing

    const ps1 = await masterMind.playerStates(0, player1.address);
    const ps2 = await masterMind.playerStates(0, player2.address);
    expect(ps1.isActive).to.equal(true);
    expect(ps2.isActive).to.equal(true);
  });

  it("full flow for a simple 1v1 game", async () => {
    const entryFee = ethers.parseUnits("10", 6);
    const gameId = 0;

    await masterMind.connect(admin).createGame(2, entryFee);

    const depositAmount = ethers.parseUnits("20", 6);
    for (const player of [player1, player2]) {
      await usdc.transfer(player.address, depositAmount);
      await usdc.connect(player).approve(await masterMind.getAddress(), depositAmount);
      await masterMind.connect(player).depositUSDC(depositAmount);
      await masterMind.connect(player).joinGame(gameId);
    }

    const round = 1;
    const salt1 = ethers.encodeBytes32String("salt1");
    const salt2 = ethers.encodeBytes32String("salt2");

    const commitment1 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "bytes32", "uint256", "uint8"],
        [PAPER, salt1, gameId, round]
      )
    );

    const commitment2 = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "bytes32", "uint256", "uint8"],
        [ROCK, salt2, gameId, round]
      )
    );

    await masterMind.connect(player1).commitMove(gameId, commitment1);
    await masterMind.connect(player2).commitMove(gameId, commitment2);

    await masterMind.connect(player1).revealMove(gameId, PAPER, salt1);
    await masterMind.connect(player2).revealMove(gameId, ROCK, salt2);

    const playersA = [player1.address];
    const playersB = [player2.address];
    const lucky = ethers.ZeroAddress;

    await masterMind.connect(admin).finalizeRound(gameId, playersA, playersB, lucky);

    const ps1 = await masterMind.playerStates(gameId, player1.address);
    const ps2 = await masterMind.playerStates(gameId, player2.address);
    expect(ps1.isActive).to.equal(true);
    expect(ps2.isActive).to.equal(false);

    const gameAfter = await masterMind.games(gameId);
    expect(gameAfter.status).to.equal(2); // Finished

    const winners: [string, string, string, string, string] = [
      player1.address,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
    ];

    const adminBalanceBefore = await usdc.balanceOf(admin.address);
    const winnerBalanceBefore = await usdc.balanceOf(player1.address);

    await masterMind.connect(admin).distributePrize(gameId, winners);

    const adminBalanceAfter = await usdc.balanceOf(admin.address);
    const winnerBalanceAfter = await usdc.balanceOf(player1.address);

    expect(adminBalanceAfter).to.be.greaterThan(adminBalanceBefore);
    expect(winnerBalanceAfter).to.be.greaterThan(winnerBalanceBefore);
    expect(await masterMind.prizeDistributed(gameId)).to.equal(true);
    expect(await masterMind.medals(player1.address)).to.equal(100);
  });
});
