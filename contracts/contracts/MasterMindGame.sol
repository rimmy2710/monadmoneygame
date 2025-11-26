// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MasterMindGame {
    IERC20 public usdc;
    IERC721 public masterMindNft;
    address public admin;
    uint16 public platformFeeBps;
    uint256 public nextGameId;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    enum GameStatus {
        Pending,
        Ongoing,
        Finished,
        Cancelled
    }

    enum RpsChoice {
        None,
        Rock,
        Paper,
        Scissors
    }

    struct UserVault {
        uint256 usdcBalance;
    }

    struct UserStats {
        uint32 gamesPlayed;
        uint32 gamesWon;
    }

    struct Game {
        uint256 id;
        uint256 entryFee;
        uint16 maxPlayers;
        GameStatus status;
        uint8 currentRound;
        uint16 playersCount;
        uint256 pool;
        address[] players;
    }

    struct PlayerState {
        bool isActive;
        uint8 currentRound;
        bytes32 commitment;
        RpsChoice revealedChoice;
    }

    mapping(address => UserVault) public userVaults;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public medals;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => PlayerState)) public playerStates;

    constructor(address _usdc, address _masterMindNft, uint16 _platformFeeBps) {
        admin = msg.sender;
        usdc = IERC20(_usdc);
        masterMindNft = IERC721(_masterMindNft);
        platformFeeBps = _platformFeeBps;
    }

    function depositUSDC(uint256 amount) external {
        require(amount > 0, "amount must be > 0");

        usdc.transferFrom(msg.sender, address(this), amount);
        userVaults[msg.sender].usdcBalance += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdrawUSDC(uint256 amount) external {
        require(amount > 0, "amount must be > 0");

        UserVault storage vault = userVaults[msg.sender];
        require(vault.usdcBalance >= amount, "insufficient balance");

        vault.usdcBalance -= amount;
        usdc.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function createGame(uint16 maxPlayers, uint256 entryFee) external {}

    function joinGame(uint256 gameId) external {}

    function commitMove(uint256 gameId, bytes32 commitment) external {}

    function revealMove(uint256 gameId, uint8 choice, bytes32 salt) external {}

    function finalizeRound(
        uint256 gameId,
        address[] calldata playersA,
        address[] calldata playersB,
        address luckyPassPlayer
    ) external {}

    function distributePrize(uint256 gameId, address[5] calldata winners) external {}
}
