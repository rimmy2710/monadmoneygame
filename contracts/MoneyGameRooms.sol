// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MoneyGameRooms is Ownable {
    using SafeERC20 for IERC20;

    // ---------- Enums ----------

    enum RoomStatus {
        Waiting,   // chưa đủ minPlayers
        Ready,     // đã đủ minPlayers, chờ start
        Started,   // đã start, gameplay đang diễn ra off-chain
        Settled,   // đã chia thưởng xong
        Cancelled  // bị huỷ, refund
    }

    enum RoomType {
        Public,    // room lớn, 10–100 người, tạo bởi operator
        Creator    // room nhỏ, <=5 người, tạo bởi NFT/Token holder hoặc WL
    }

    // ---------- Structs ----------

    struct GameRoom {
        uint256 id;
        RoomType roomType;
        RoomStatus status;

        address token;        // MON hoặc USDC
        uint256 entryFee;     // 1u

        uint256 minPlayers;
        uint256 maxPlayers;

        address creator;      // operator hoặc creator/KOL
        uint256 createdAt;
        uint256 startedAt;
        uint256 endedAt;

        address[] players;
        bool settled;
    }

    // ---------- State ----------

    uint256 public nextRoomId;
    mapping(uint256 => GameRoom) public rooms; // roomId => GameRoom

    address public devWallet;      // ví nhận 10% fee
    address public operator;       // backend / EOA được phép startGame + settleGame

    // Token địa chỉ (MON, USDC)
    address public tokenMON;
    address public tokenUSDC;

    // NFT / Token cho phép tạo room Creator
    address public creatorNFT;        // IERC721
    address public creatorToken;      // IERC20
    uint256 public creatorTokenMin;   // tối thiểu số token để được tạo room

    // KOL, WL
    mapping(address => bool) public whitelistedCreators;

    // ---------- Events ----------

    event RoomCreated(
        uint256 indexed roomId,
        RoomType roomType,
        address indexed creator,
        address token,
        uint256 entryFee,
        uint256 minPlayers,
        uint256 maxPlayers
    );

    event PlayerJoined(uint256 indexed roomId, address indexed player);

    event GameStarted(uint256 indexed roomId);

    event GameSettled(
        uint256 indexed roomId,
        address indexed top1,
        address indexed top2,
        address top3,
        address top4,
        uint256 pool
    );

    event RewardPaid(uint256 indexed roomId, address indexed player, uint256 amount);
    event FeePaid(uint256 indexed roomId, uint256 amount);
    event RoomCancelled(uint256 indexed roomId);

    // ---------- Modifiers ----------

    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    // ---------- Constructor & Admin Config ----------

    constructor(
        address _devWallet,
        address _operator,
        address _tokenMON,
        address _tokenUSDC
    ) {
        require(_devWallet != address(0), "Invalid dev wallet");
        require(_operator != address(0), "Invalid operator");
        require(_tokenMON != address(0), "Invalid MON");
        require(_tokenUSDC != address(0), "Invalid USDC");

        devWallet = _devWallet;
        operator = _operator;
        tokenMON = _tokenMON;
        tokenUSDC = _tokenUSDC;

        nextRoomId = 1;
    }

    function setCreatorNFT(address _nft) external onlyOwner {
        creatorNFT = _nft;
    }

    function setCreatorToken(address _token, uint256 _minAmount) external onlyOwner {
        creatorToken = _token;
        creatorTokenMin = _minAmount;
    }

    function setWhitelistedCreator(address _addr, bool _allowed) external onlyOwner {
        whitelistedCreators[_addr] = _allowed;
    }

    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid operator");
        operator = _operator;
    }

    function setDevWallet(address _devWallet) external onlyOwner {
        require(_devWallet != address(0), "Invalid dev wallet");
        devWallet = _devWallet;
    }

    // ---------- Internal helpers ----------

    function _isCreator(address user) internal view returns (bool) {
        if (whitelistedCreators[user]) return true;

        // NFT check
        if (creatorNFT != address(0)) {
            if (IERC721(creatorNFT).balanceOf(user) > 0) {
                return true;
            }
        }

        // ERC20 check
        if (creatorToken != address(0) && creatorTokenMin > 0) {
            if (IERC20(creatorToken).balanceOf(user) >= creatorTokenMin) {
                return true;
            }
        }

        return false;
    }

    function _validateTopPlayers(
        GameRoom storage room,
        address top1,
        address top2,
        address top3,
        address top4
    ) internal view {
        // cho phép address(0) nếu không đủ top
        if (top1 != address(0)) {
            require(_isPlayerInRoom(room, top1), "top1 not in room");
        }
        if (top2 != address(0)) {
            require(_isPlayerInRoom(room, top2), "top2 not in room");
        }
        if (top3 != address(0)) {
            require(_isPlayerInRoom(room, top3), "top3 not in room");
        }
        if (top4 != address(0)) {
            require(_isPlayerInRoom(room, top4), "top4 not in room");
        }

        // đảm bảo không trùng người cho các vị trí khác nhau
        require(!_anyDupNonZero(top1, top2, top3, top4), "duplicate tops");
    }

    function _isPlayerInRoom(GameRoom storage room, address player) internal view returns (bool) {
        uint256 len = room.players.length;
        for (uint256 i = 0; i < len; i++) {
            if (room.players[i] == player) {
                return true;
            }
        }
        return false;
    }

    function _anyDupNonZero(
        address a,
        address b,
        address c,
        address d
    ) internal pure returns (bool) {
        // so sánh các cặp, bỏ qua address(0)
        if (a != address(0) && (a == b || a == c || a == d)) return true;
        if (b != address(0) && (b == c || b == d)) return true;
        if (c != address(0) && c == d) return true;
        return false;
    }

    // ---------- Public / External functions ----------

    /// @notice Tạo room Public (10–100 người), chỉ operator được tạo
    function createRoomPublic(
        address token,          // tokenMON hoặc tokenUSDC
        uint256 entryFee,       // 1u
        uint256 minPlayers,     // gợi ý: 10
        uint256 maxPlayers      // gợi ý: 100
    ) external onlyOperator returns (uint256 roomId) {
        require(token == tokenMON || token == tokenUSDC, "Invalid token");
        require(minPlayers > 0 && maxPlayers >= minPlayers, "Invalid players");

        roomId = nextRoomId++;
        GameRoom storage room = rooms[roomId];

        room.id = roomId;
        room.roomType = RoomType.Public;
        room.status = RoomStatus.Waiting;
        room.token = token;
        room.entryFee = entryFee;
        room.minPlayers = minPlayers;
        room.maxPlayers = maxPlayers;
        room.creator = msg.sender;
        room.createdAt = block.timestamp;

        emit RoomCreated(roomId, room.roomType, room.creator, token, entryFee, minPlayers, maxPlayers);
    }

    /// @notice Tạo room Creator (<=5 người), chỉ NFT/Token holder hoặc WL được tạo
    function createRoomCreator(
        address token,
        uint256 entryFee,
        uint256 minPlayers,
        uint256 maxPlayers   // <= 5 theo rule
    ) external returns (uint256 roomId) {
        require(_isCreator(msg.sender), "Not allowed to create room");
        require(token == tokenMON || token == tokenUSDC, "Invalid token");
        require(minPlayers > 0 && maxPlayers >= minPlayers, "Invalid players");
        require(maxPlayers <= 5, "Creator room max 5 players");

        roomId = nextRoomId++;
        GameRoom storage room = rooms[roomId];

        room.id = roomId;
        room.roomType = RoomType.Creator;
        room.status = RoomStatus.Waiting;
        room.token = token;
        room.entryFee = entryFee;
        room.minPlayers = minPlayers;
        room.maxPlayers = maxPlayers;
        room.creator = msg.sender;
        room.createdAt = block.timestamp;

        emit RoomCreated(roomId, room.roomType, room.creator, token, entryFee, minPlayers, maxPlayers);
    }

    /// @notice User join room và nạp entryFee (1u)
    function joinRoom(uint256 roomId) external {
        GameRoom storage room = rooms[roomId];
        require(room.id != 0, "Room not found");
        require(
            room.status == RoomStatus.Waiting || room.status == RoomStatus.Ready,
            "Room not open"
        );
        require(room.players.length < room.maxPlayers, "Room full");

        // không join 2 lần
        uint256 len = room.players.length;
        for (uint256 i = 0; i < len; i++) {
            require(room.players[i] != msg.sender, "Already joined");
        }

        IERC20 token = IERC20(room.token);
        token.safeTransferFrom(msg.sender, address(this), room.entryFee);

        room.players.push(msg.sender);

        // nếu đạt minPlayers thì set trạng thái Ready
        if (room.players.length >= room.minPlayers) {
            room.status = RoomStatus.Ready;
        }

        emit PlayerJoined(roomId, msg.sender);
    }

    /// @notice Operator start game (ví dụ sau khi đủ người + đếm ngược 30s)
    function startGame(uint256 roomId) external onlyOperator {
        GameRoom storage room = rooms[roomId];
        require(room.id != 0, "Room not found");
        require(room.status == RoomStatus.Ready, "Room not ready");
        require(room.players.length >= room.minPlayers, "Not enough players");

        room.status = RoomStatus.Started;
        room.startedAt = block.timestamp;

        emit GameStarted(roomId);
    }

    /// @notice Backend/operator gửi kết quả Top 1–4 để chia thưởng
    function settleGame(
        uint256 roomId,
        address top1,
        address top2,
        address top3,
        address top4
    ) external onlyOperator {
        GameRoom storage room = rooms[roomId];
        require(room.id != 0, "Room not found");
        require(!room.settled, "Already settled");
        require(room.status == RoomStatus.Started, "Game not started");

        _validateTopPlayers(room, top1, top2, top3, top4);

        uint256 playerCount = room.players.length;
        require(playerCount > 0, "No players");

        uint256 pool = room.entryFee * playerCount;

        // payout:
        // Top1: 50%, Top2: 30%, Top3: 5%, Top4: 5%, Fee: 10%
        uint256 feeAmount = (pool * 10) / 100;
        uint256 reward1 = (pool * 50) / 100;
        uint256 reward2 = (pool * 30) / 100;
        uint256 reward3 = (pool * 5) / 100;
        uint256 reward4 = (pool * 5) / 100;

        IERC20 token = IERC20(room.token);

        if (top1 != address(0) && reward1 > 0) {
            token.safeTransfer(top1, reward1);
            emit RewardPaid(roomId, top1, reward1);
        }
        if (top2 != address(0) && reward2 > 0) {
            token.safeTransfer(top2, reward2);
            emit RewardPaid(roomId, top2, reward2);
        }
        if (top3 != address(0) && reward3 > 0) {
            token.safeTransfer(top3, reward3);
            emit RewardPaid(roomId, top3, reward3);
        }
        if (top4 != address(0) && reward4 > 0) {
            token.safeTransfer(top4, reward4);
            emit RewardPaid(roomId, top4, reward4);
        }

        if (feeAmount > 0) {
            token.safeTransfer(devWallet, feeAmount);
            emit FeePaid(roomId, feeAmount);
        }

        room.settled = true;
        room.status = RoomStatus.Settled;
        room.endedAt = block.timestamp;

        emit GameSettled(roomId, top1, top2, top3, top4, pool);
    }

    /// @notice (Optional) Owner/operator có thể huỷ room và refund cho tất cả players nếu cần
    function cancelRoom(uint256 roomId) external onlyOperator {
        GameRoom storage room = rooms[roomId];
        require(room.id != 0, "Room not found");
        require(
            room.status == RoomStatus.Waiting || room.status == RoomStatus.Ready,
            "Cannot cancel"
        );
        require(!room.settled, "Already settled");

        IERC20 token = IERC20(room.token);
        uint256 len = room.players.length;

        for (uint256 i = 0; i < len; i++) {
            token.safeTransfer(room.players[i], room.entryFee);
        }

        room.status = RoomStatus.Cancelled;
        room.endedAt = block.timestamp;

        emit RoomCancelled(roomId);
    }
}
