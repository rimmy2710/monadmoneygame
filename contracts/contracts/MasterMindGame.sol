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

    event GameCreated(uint256 indexed gameId, uint16 maxPlayers, uint256 entryFee);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 entryFee);
    event MoveCommitted(uint256 indexed gameId, address indexed player, uint8 round);
    event MoveRevealed(
        uint256 indexed gameId,
        address indexed player,
        uint8 round,
        RpsChoice choice
    );
    event RoundFinalized(uint256 indexed gameId, uint8 round);
    event PlayerEliminated(uint256 indexed gameId, address indexed player, uint8 round);
    event PlayerAdvanced(uint256 indexed gameId, address indexed player, uint8 newRound);
    event PrizeDistributed(
        uint256 indexed gameId,
        uint256 pool,
        uint256 platformFee,
        address[5] winners
    );


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

    mapping(uint256 => bool) public prizeDistributed;



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


    function createGame(uint16 maxPlayers, uint256 entryFee) external {
        require(msg.sender == admin, "only admin");
        require(entryFee > 0, "entry fee must be > 0");
        require(maxPlayers >= 2 && maxPlayers <= 100, "maxPlayers must be 2-100");

        uint256 gameId = nextGameId;
        nextGameId++;

        Game storage game = games[gameId];
        game.id = gameId;
        game.entryFee = entryFee;
        game.maxPlayers = maxPlayers;
        game.status = GameStatus.Pending;
        game.currentRound = 0;
        game.playersCount = 0;
        game.pool = 0;

        emit GameCreated(gameId, maxPlayers, entryFee);
    }

    function joinGame(uint256 gameId) external {
        Game storage game = games[gameId];

        require(game.id == gameId, "game does not exist");
        require(game.status == GameStatus.Pending, "game not joinable");
        require(game.playersCount < game.maxPlayers, "game is full");

        UserVault storage vault = userVaults[msg.sender];
        require(vault.usdcBalance >= game.entryFee, "insufficient vault balance");

        PlayerState storage ps = playerStates[gameId][msg.sender];
        require(!ps.isActive, "already joined");

        vault.usdcBalance -= game.entryFee;
        game.pool += game.entryFee;
        game.playersCount += 1;
        game.players.push(msg.sender);

        ps.isActive = true;
        ps.currentRound = 1;
        ps.commitment = bytes32(0);
        ps.revealedChoice = RpsChoice.None;

        UserStats storage stats = userStats[msg.sender];
        stats.gamesPlayed += 1;

        if (game.playersCount == game.maxPlayers) {
            game.status = GameStatus.Ongoing;
            game.currentRound = 1;
        }

        emit PlayerJoined(gameId, msg.sender, game.entryFee);
    }

    function commitMove(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];

        require(game.id == gameId, "game does not exist");
        require(game.status == GameStatus.Ongoing, "game not ongoing");

        PlayerState storage ps = playerStates[gameId][msg.sender];

        require(ps.isActive, "player not active");
        require(ps.currentRound > 0, "invalid round");
        require(ps.commitment == bytes32(0), "already committed");
        require(commitment != bytes32(0), "invalid commitment");

        ps.commitment = commitment;
        ps.revealedChoice = RpsChoice.None;

        emit MoveCommitted(gameId, msg.sender, ps.currentRound);
    }

    function revealMove(uint256 gameId, uint8 choice, bytes32 salt) external {
        Game storage game = games[gameId];
        require(game.id == gameId, "game does not exist");
        require(game.status == GameStatus.Ongoing, "game not ongoing");

        PlayerState storage ps = playerStates[gameId][msg.sender];

        require(ps.isActive, "player not active");
        require(ps.currentRound > 0, "invalid round");
        require(ps.commitment != bytes32(0), "no commitment");
        require(ps.revealedChoice == RpsChoice.None, "already revealed");
        require(
            choice >= uint8(RpsChoice.Rock) && choice <= uint8(RpsChoice.Scissors),
            "invalid choice"
        );

        bytes32 expected = keccak256(abi.encodePacked(choice, salt, gameId, ps.currentRound));

        require(expected == ps.commitment, "commitment mismatch");

        ps.revealedChoice = RpsChoice(choice);
        ps.commitment = bytes32(0);

        emit MoveRevealed(gameId, msg.sender, ps.currentRound, RpsChoice(choice));
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

    ) external {
        require(msg.sender == admin, "only admin");

        Game storage game = games[gameId];

        require(game.id == gameId, "game does not exist");
        require(game.status == GameStatus.Ongoing, "game not ongoing");
        require(playersA.length == playersB.length, "pair arrays length mismatch");

        uint8 currentRoundNumber = game.currentRound;

        for (uint256 i = 0; i < playersA.length; i++) {
            address a = playersA[i];
            address b = playersB[i];

            PlayerState storage pa = playerStates[gameId][a];
            PlayerState storage pb = playerStates[gameId][b];

            require(pa.isActive && pb.isActive, "inactive player in pair");
            require(pa.currentRound == currentRoundNumber, "wrong round for A");
            require(pb.currentRound == currentRoundNumber, "wrong round for B");

            RpsChoice ca = pa.revealedChoice;
            RpsChoice cb = pb.revealedChoice;

            require(ca != RpsChoice.None || cb != RpsChoice.None, "no choices");

            if (ca == RpsChoice.None && cb == RpsChoice.None) {
                pa.isActive = false;
                pb.isActive = false;
                emit PlayerEliminated(gameId, a, currentRoundNumber);
                emit PlayerEliminated(gameId, b, currentRoundNumber);
            } else if (ca == RpsChoice.None) {
                pa.isActive = false;
                emit PlayerEliminated(gameId, a, currentRoundNumber);

                pb.currentRound += 1;
                emit PlayerAdvanced(gameId, b, pb.currentRound);
            } else if (cb == RpsChoice.None) {
                pb.isActive = false;
                emit PlayerEliminated(gameId, b, currentRoundNumber);

                pa.currentRound += 1;
                emit PlayerAdvanced(gameId, a, pa.currentRound);
            } else {
                uint8 outcome = _determineOutcome(ca, cb);

                if (outcome == 0) {
                    pa.isActive = false;
                    pb.isActive = false;
                    emit PlayerEliminated(gameId, a, currentRoundNumber);
                    emit PlayerEliminated(gameId, b, currentRoundNumber);
                } else if (outcome == 1) {
                    pb.isActive = false;
                    emit PlayerEliminated(gameId, b, currentRoundNumber);

                    pa.currentRound += 1;
                    emit PlayerAdvanced(gameId, a, pa.currentRound);
                } else {
                    pa.isActive = false;
                    emit PlayerEliminated(gameId, a, currentRoundNumber);

                    pb.currentRound += 1;
                    emit PlayerAdvanced(gameId, b, pb.currentRound);
                }
            }

            pa.commitment = bytes32(0);
            pb.commitment = bytes32(0);
            pa.revealedChoice = RpsChoice.None;
            pb.revealedChoice = RpsChoice.None;
        }

        if (luckyPassPlayer != address(0)) {
            PlayerState storage pl = playerStates[gameId][luckyPassPlayer];

            require(pl.isActive, "lucky not active");
            require(pl.currentRound == currentRoundNumber, "lucky wrong round");
            require(masterMindNft.balanceOf(luckyPassPlayer) > 0, "lucky must hold NFT");

            pl.currentRound += 1;
            emit PlayerAdvanced(gameId, luckyPassPlayer, pl.currentRound);
        }

        uint256 activeCount = 0;
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            if (playerStates[gameId][player].isActive) {
                activeCount++;
            }
        }

        if (activeCount > 5) {
            game.currentRound += 1;
        } else {
            game.status = GameStatus.Finished;
        }

        emit RoundFinalized(gameId, currentRoundNumber);
    }

    function distributePrize(uint256 gameId, address[5] calldata winners) external {
        require(msg.sender == admin, "only admin");

        Game storage game = games[gameId];
        require(game.id == gameId, "game does not exist");
        require(game.status == GameStatus.Finished, "game not finished");
        require(!prizeDistributed[gameId], "prize already distributed");

        uint256 pool = game.pool;
        require(pool > 0, "no pool");

        uint256 platformFee = (pool * platformFeeBps) / 10000;
        uint256 prizePool = pool - platformFee;

        uint256 top1 = (prizePool * 50) / 100;
        uint256 top2 = (prizePool * 30) / 100;
        uint256 top3 = (prizePool * 5) / 100;
        uint256 top4 = (prizePool * 5) / 100;

        if (platformFee > 0) {
            usdc.transfer(admin, platformFee);
        }

        if (winners[0] != address(0) && top1 > 0) {
            usdc.transfer(winners[0], top1);
            medals[winners[0]] += 100;
        }

        if (winners[1] != address(0) && top2 > 0) {
            usdc.transfer(winners[1], top2);
        }

        if (winners[2] != address(0) && top3 > 0) {
            usdc.transfer(winners[2], top3);
        }

        if (winners[3] != address(0) && top4 > 0) {
            usdc.transfer(winners[3], top4);
        }

        prizeDistributed[gameId] = true;

        emit PrizeDistributed(gameId, pool, platformFee, winners);
    }

    function _determineOutcome(RpsChoice a, RpsChoice b) internal pure returns (uint8) {
        if (a == b) {
            return 0;
        }

        if (
            (a == RpsChoice.Rock && b == RpsChoice.Scissors) ||
            (a == RpsChoice.Paper && b == RpsChoice.Rock) ||
            (a == RpsChoice.Scissors && b == RpsChoice.Paper)
        ) {
            return 1;
        }

        return 2;
    }
=======
    ) external {}

    function distributePrize(uint256 gameId, address[5] calldata winners) external {}

}
