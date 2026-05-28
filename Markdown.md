ĐẶC TẢ HỆ THỐNG & KẾ HOẠCH TRIỂN KHAI
1. Tổng quan dự án
Mô tả: Hệ thống dự đoán tỉ số World Cup tập trung vào tính cạnh tranh (Gamification) và trải nghiệm mobile mượt mà.
Đối tượng: Người hâm mộ bóng đá tham gia theo nhóm (công ty, bạn bè).
Công nghệ:
Backend: NestJS, MySQL, CronJob (Schedule), Cache Module.
Frontend: Next.js (Mobile-first), TailwindCSS.
Thư viện: react-beautiful-dnd, canvas-confetti, react-countdown.
Auth: Google SSO (JWT).
2. Thiết kế Cơ sở dữ liệu
Users: id, email, google_id, username, avatar_url.
Groups: id, name, invite_code (UUID).
User_Groups: user_id, group_id, role (Owner/Member).
Matches: id, home_team, away_team, start_time, status (Scheduled/Finished), home_score, away_score.
Predictions: user_id, match_id, pred_home, pred_away, points_earned, updated_at.
Tournament_Predictions: user_id, type (WINNER, FIRST_OUT, GOLDEN_BOOT), value, created_at.
3. Quy chuẩn Code
Naming: camelCase cho biến/hàm, PascalCase cho Class.
Error Handling: Chuẩn JSON { success: false, message: '...' }.
Security: Middleware kiểm tra Google JWT, khóa dự đoán trước 15 phút.
4. API Endpoints
Auth: GET /auth/google (Redirect), GET /auth/google/callback.
Groups: POST /groups (Create), POST /groups/join (Invite code).
Matches: GET /matches (Danh sách kèm đếm ngược).
Predictions: POST /predictions (Cập nhật tỷ số), GET /predictions/leaderboard (BXH nhóm).
5. Kế hoạch triển khai
Bước 1: Khởi tạo Repo Next.js/NestJS, ENV.
Bước 2: Migration Database & Seeding dữ liệu trận đấu mẫu.
Bước 3: Tích hợp Google SSO Passport.
Bước 4: Lập trình Logic tính điểm 3/1/0 và Worker CronJob cập nhật kết quả.
Bước 5: Phát triển UI Mobile (3 màn hình chính) & kết nối API.
Bước 6: Test logic khóa kèo 15 phút và hiệu ứng pháo hoa.