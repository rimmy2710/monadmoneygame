# Monad MoneyGame – V1 Scope & Game Rules

## 1. Mục tiêu V1

V1 tập trung vào:

- Một mode chơi chính:
  - Nhiều người chơi cùng phòng (room 10–100 người).
  - Mỗi người đóng 1 đơn vị token (1u) và tham gia chơi RPS nhiều round.
  - Kết quả xếp hạng theo tổng điểm (point), không phải chỉ số round thắng.
- Trải nghiệm end-to-end:
  - Người chơi connect ví, vào room, đóng 1u, chơi game, nhận thưởng (nếu vào top).
  - Backend + smart contract phối hợp để đảm bảo logic game & payout.
- Chưa làm trong V1:
  - Social linking sâu (Gmail/X/Discord).
  - Hệ referral đầy đủ.
  - UI hiệu ứng phức tạp, analytic nâng cao.

---

## 2. Cấu trúc trận & tính điểm

### 2.1. Vòng chơi

Có 2 loại trận:

- Vòng loại (Qualifier): **Best-of-3** rounds.
- Vòng chung kết (Final): **Best-of-5** rounds.

“Best-of-N” ở đây **không** dùng để xét thắng/thua trực tiếp mà dùng làm số round tối đa để tính điểm.

### 2.2. Điểm (Point) mỗi round

Trong mỗi round:

- Thắng round: **+5 point**
- Thua round: **0 point**
- Hòa round:
  - Người có **điểm cống hiến (contribution score) cao hơn**: **+1.5 point**
  - Người có **điểm cống hiến thấp hơn**: **+1 point**

> “Điểm cống hiến” là chỉ số off-chain (do backend tính) để đánh giá độ “cống hiến” trong hệ thống, dùng làm tie-breaker khi round hòa. V1 chỉ cần đảm bảo backend luôn cung cấp được giá trị để so sánh.

### 2.3. Kết quả trận

- Sau 3 (hoặc 5) round:
  - Tính tổng point của từng người chơi.
- Sắp xếp người chơi theo tổng point giảm dần → xác định **Top 1, Top 2, Top 3, Top 4**.
- Tổng point cao hơn → xếp hạng cao hơn.
- Nếu tổng point bằng nhau:
  - Backend có thể áp dụng tie-breaker phụ (VD: tổng “điểm cống hiến”, thời gian tham gia, v.v.).  
  - V1 chỉ cần contract nhận danh sách Top 1–4 từ backend.

---

## 3. Xử lý hòa & timeout

### 3.1. Round hòa (tie)

- Nếu kết quả round là hòa:
  - **Replay round**, round đó không tính điểm.
  - Replay **tối đa 5 lần** cho cùng một round.
- Sau round hợp lệ cuối cùng, mới áp dụng điểm theo 2.2.

### 3.2. Hết 15 giây mà không chọn (commit)

- Mỗi round có **15 giây** để người chơi chọn Keo/Búa/Bao.
- Nếu sau 15 giây **user chưa chọn move**:
  - Hệ thống (backend) sẽ **random Keo/Búa/Bao** cho user.
  - Về mặt kỹ thuật:
    - Backend sinh move random.
    - Backend tự commit move đó thay cho user.

### 3.3. Hết 15 giây mà không reveal

- Sau khi commit, mỗi user có **15 giây** để reveal (gửi move + salt).
- Nếu người chơi:
  - **Đã có move** (do chính họ chọn hoặc auto-random):

    - Hệ thống sẽ **tự động reveal move gần nhất** cho user.

  - **Chưa có move**:
    - Hệ thống sẽ **random Keo/Búa/Bao** và dùng move random đó để reveal.

=> V1 không có case “bị xử thua vì không reveal”. Game đảm bảo luôn có move được reveal (user chọn hoặc auto-random).

### 3.4. Random

- V1 sử dụng **random off-chain (backend)**:
  - Backend sinh move random cho các trường hợp cần auto chọn.
  - Backend chịu trách nhiệm bảo đảm fairness ở mức chấp nhận được với MVP.
- Sau này có thể nâng cấp lên VRF on-chain nếu cần.

---

## 4. Cấu trúc room, số lượng người chơi & FOMO

### 4.1. Room

- Mỗi room là một game có:
  - Token dùng để stake: MON hoặc USDC (trên Monad).
  - Entry fee: **1u** (1 đơn vị token: 1 MON hoặc 1 USDC).
  - `minPlayers = 10`, `maxPlayers = 100`.

### 4.2. Logic bắt đầu game (FOMO)

- Người chơi connect ví → chọn room → **join** (góp 1u).
- Khi số người chơi:
  - **< 10**: game chưa thể start.
  - **≥ 10**: game có thể bắt đầu.
- Khi số người đã **đủ tối thiểu (≥10)**:
  - Hệ thống có thể **auto-start sau 30 giây**:
    - Backend gọi transaction `startGame(roomId)`.
    - Tạo cảm giác FOMO (nếu không vào nhanh sẽ lỡ room).

---

## 5. Token & payout

### 5.1. Token

- Token hỗ trợ V1:
  - **MON** (native token trên Monad):
    - Address: `0x3bd359c1119da7da1d913d1c4d2b7c461115433a`
  - **USDC** (stablecoin trên Monad):
    - Address: `0x754704bc059f8c67012fed69bc8a327a5aafb603`
- V1 không sử dụng oracle giá USD; `1u` được hiểu là `1 MON` hoặc `1 USDC` tuỳ room.

### 5.2. Pool & phân bổ phần thưởng

- Mỗi người chơi đóng **1u** vào room.
- Tổng pool:
  - `pool = entryFee * numberOfPlayers`
- Payout (chưa tính gas network):

  - **Top 1**: 50% pool  
  - **Top 2**: 30% pool  
  - **Top 3**: 5% pool  
  - **Top 4**: 5% pool  
  - **Fee game** (system): 10% pool → ví dev

- Địa chỉ ví dev:
  - `0x672ed8e3348de8d1a6a94f5267d9df37e44b8cd8`

- Tỷ lệ luôn:
  - 50% + 30% + 5% + 5% + 10% = 100% pool.

---

## 6. Vai trò hệ thống

### 6.1. Smart contract

- Quản lý:
  - Room (token, entryFee, minPlayers, maxPlayers).
  - Danh sách người chơi & số tiền stake.
  - Payout pool theo kết quả do backend cung cấp.
- Đảm bảo:
  - Không thể settle 2 lần 1 room.
  - Người nhận thưởng thuộc danh sách người chơi.
  - Tính đúng tỷ lệ payout + fee.

### 6.2. Backend (operator / trọng tài)

- Tính toàn bộ logic gameplay off-chain:
  - Random move khi user không chọn/reveal.
  - Tính điểm từng round theo rule.
  - Xử lý tie, replay round tối đa 5 lần.
  - Tổng hợp point & xác định Top 1–4.
- Gọi contract:
  - `startGame(roomId)` khi game đủ điều kiện bắt đầu.
  - `settleGame(roomId, top1, top2, top3, top4)` khi game kết thúc.

### 6.3. Frontend

- Hiển thị:
  - Danh sách room, số người trong room.
  - Màn hình chơi: chọn move, countdown commit/reveal, hiển thị kết quả.
  - Leaderboard, ranking.
- Gọi backend:
  - Join room, lấy game state, lịch sử rounds, kết quả.

---

## 7. Out of scope cho V1

Các tính năng **chưa** nằm trong phạm vi V1:

- Referral system đầy đủ (link giới thiệu, chia thưởng multi-level).
- Social linking sâu với Gmail/X/Discord.
- On-chain VRF cho random.
- Đa dạng game mode (ngoài RPS).
- Hệ thống tier/phân hạng phức tạp (ngoài việc dùng point & contribution ở mức cơ bản).
