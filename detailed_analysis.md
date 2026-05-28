BÁO CÁO KỸ THUẬT: KIẾN TRÚC HỆ THỐNG VÀ THIẾT KẾ UI MOBILE - DỰ ÁN WORLD CUP PREDICTION

1. Tổng quan Đợt Cập nhật Kiến trúc

Dưới góc độ điều phối kỹ thuật, đợt cập nhật này được xây dựng dựa trên triết lý thiết kế "Triệt tiêu ma sát" (Frictionless) và mô hình Gamification chuyên sâu. Mục tiêu tối thượng của hệ thống là thiết lập một "Vòng lặp phản hồi" (Feedback Loop) thời gian thực, đảm bảo sự ổn định và mượt mà tuyệt đối dưới áp lực truy cập cực lớn trong mùa giải World Cup.

Kiến trúc mới tập trung vào 4 mục tiêu cốt lõi:

* Tinh gọn mô hình lưu trữ: Chuyển đổi sang kiến trúc Update-based để tối ưu hóa tài nguyên và triệt tiêu độ phức tạp của các truy vấn lịch sử.
* Chuẩn hóa định danh người dùng: Thiết lập Google SSO làm "Source of Truth" duy nhất, giúp tối giản hóa quy trình Onboarding và tăng tỷ lệ chuyển đổi.
* Cơ cấu lại quản lý nhóm: Triển khai Junction Table để hỗ trợ linh hoạt mô hình Multi-group Dashboard (Bảng điều khiển đa nhóm).
* Tối ưu hiệu năng hệ thống: Giảm thiểu tranh chấp tài nguyên (Row-level locking contention) và đảm bảo khả năng khôi phục dữ liệu chính xác tại một thời điểm (PITR).

2. Quản lý Định danh và Thực thể Người dùng (Users)

Nhằm đạt được trải nghiệm Frictionless UX, hệ thống đã loại bỏ hoàn toàn trường invite_code. Việc buộc người dùng nhập mã mời thủ công được xác định là một rào cản nhận thức lớn, gây gián đoạn dòng chảy trải nghiệm. Hệ thống hiện ưu tiên tính tự động hóa và định danh nhất quán thông qua các nhà cung cấp định danh (IdP).

Cấu trúc bảng Users

Tên trường	Kiểu dữ liệu	Mô tả	Ràng buộc
user_id	INT	Mã định danh nội bộ	PK, AUTO_INCREMENT
username	VARCHAR(50)	Tên hiển thị của người dùng	UNIQUE, NOT NULL
email	VARCHAR(100)	Email định danh từ Google	UNIQUE, NOT NULL
google_id	VARCHAR(255)	ID định danh từ Google IdP	UNIQUE, NOT NULL
avatar_url	TEXT	Ảnh đại diện đồng bộ từ Google	DEFAULT NULL

Lợi ích chiến lược của Google SSO

* Xác thực không trạng thái (Stateless Authentication): Sử dụng Google JWT giúp Backend giảm tải lưu trữ session, hỗ trợ khả năng mở rộng (scaling) tức thì khi đối mặt với lưu lượng truy cập đột biến (high-concurrency) ngay trước thời điểm bóng lăn.
* Độ tin cậy tuyệt đối: Thu hẹp bề mặt tấn công bằng cách ủy thác các tác vụ bảo mật quan trọng cho hạ tầng tiêu chuẩn toàn cầu của Google.
* Giảm chi phí vận hành (Operational Overhead): Loại bỏ hoàn toàn rủi ro và chi phí liên quan đến quản lý mật khẩu, Salt hay Hash thủ công tại hệ thống nội bộ.

3. Mô hình Dữ liệu Dự đoán (Predictions) và Hiệu suất

Hệ thống thực hiện bước chuyển đổi chiến lược từ mô hình "Insert-Only" sang mô hình Update-based. Thay vì ghi nhật ký mọi thay đổi, hệ thống chỉ duy trì và cập nhật một bản ghi duy nhất cho mỗi bộ đôi user_id và match_id.

Lợi ích kỹ thuật của mô hình Update-based

1. Tối ưu tài nguyên & Atomics: Giảm dư thừa dữ liệu và áp lực lên I/O. Quan trọng nhất, cơ chế này giúp tránh tình trạng Row-level locking contention, đảm bảo các cập nhật diễn ra với độ trễ thấp nhất trong các đợt cao điểm trước trận đấu.
2. Đơn giản hóa logic nghiệp vụ: Loại bỏ các truy vấn MAX(version) phức tạp, giúp các Worker tính toán điểm số đạt hiệu suất tối đa mà không cần xử lý lặp lại dữ liệu thừa.
3. Hỗ trợ phục hồi dữ liệu (PITR): Việc sử dụng trường created_at với độ chính xác cao DATETIME(3) kết hợp với cơ chế ghi đè cho phép triển khai chiến lược Point-in-Time Recovery hiệu quả và chính xác hơn.

Cấu trúc bảng Predictions

Tên trường	Kiểu dữ liệu	Mô tả	Ràng buộc
pred_id	INT	Mã định danh dự đoán	PK, AUTO_INCREMENT
user_id	INT	Tham chiếu đến người dùng	FK, NOT NULL
match_id	INT	Tham chiếu đến trận đấu	FK, NOT NULL
pred_home_score	TINYINT	Dự đoán tỷ số đội nhà	NOT NULL
pred_away_score	TINYINT	Dự đoán tỷ số đội khách	NOT NULL
points_earned	TINYINT	Điểm đạt được (3/1/0)	DEFAULT 0
created_at	DATETIME(3)	Thời điểm ghi nhận hoặc cập nhật	NOT NULL

Lưu ý: Việc đánh Index cho trường created_at là yêu cầu bắt buộc. Điều này đảm bảo hiệu suất truy vấn cho logic Tie-break và giữ tốc độ phản hồi của các bảng xếp hạng nhóm ổn định khi quy mô dữ liệu tăng trưởng theo thời gian thực.

4. Lược đồ Quan hệ Thực thể (ERD)

Kiến trúc quan hệ được thiết kế để hỗ trợ khả năng truy xuất đa chiều và quản lý linh hoạt giữa các thực thể:

* Users - Predictions (1:N): Một người dùng sở hữu nhiều dự đoán, nhưng hệ thống cưỡng bức tính duy nhất cho mỗi trận đấu thông qua bộ khóa ngoại.
* Matches - Predictions (1:N): Trận đấu đóng vai trò thực thể trung tâm, điều phối mọi dữ liệu dự đoán từ cộng đồng người dùng.
* Users - Tournament_Predictions (1:N): Quản lý các thị trường dự đoán dài hạn (Outright Markets) như dự đoán Đội vô địch.
* Users - Groups (N:M): Được triển khai thông qua Junction Table (bảng trung gian User_Groups). Đây là yếu tố then chốt cho phép người dùng tham gia nhiều cộng đồng khác nhau mà không làm gia tăng dư thừa dữ liệu, đồng thời hỗ trợ chuyển đổi nhóm tức thì.

5. Logic Nghiệp vụ và Thuật toán Gamification

Hệ thống sử dụng Batch Processing Trigger để xử lý điểm số tập trung, tránh gây quá tải cơ sở dữ liệu ngay khi trận đấu kết thúc.

Thuật toán tính điểm 3/1/0

Kết quả thực tế	Dự đoán của người dùng	Điểm số
Khớp hoàn toàn tỷ số	Trùng khớp 100% tỷ số	3
Đúng xu hướng (W/D/L)	Sai tỷ số cụ thể nhưng đúng kết quả chung cuộc	1
Sai xu hướng	Không trùng khớp kết quả thắng/thua/hòa	0

Hệ thống Phân hạng (Tie-break Hierarchy)

Trong trường hợp bằng điểm, thứ tự ưu tiên phân hạng được áp dụng nghiêm ngặt theo danh sách sau:

1. Người dùng dự đoán chính xác Đội vô địch (WINNER) trong phần Outright Markets.
2. Người dùng có tổng số trận đấu đạt điểm tuyệt đối (3 điểm) cao nhất.
3. Ultimate Truth: Căn cứ vào dấu thời gian created_at sớm nhất của các dự đoán Tiên tri (WINNER hoặc FIRST_OUT).

Cơ chế "Tiên tri sớm" (Early Prophecy)

Một Database Worker chạy ngầm sẽ liên tục giám sát trạng thái giải đấu. Ngay khi một đội tuyển bị loại về mặt toán học, hệ thống tự động cộng 5 điểm thưởng cho người dùng có dự đoán FIRST_OUT chính xác. Đây là cơ chế thưởng cho những người dùng có tầm nhìn xa nhất (early prediction).

6. Giao thức Bảo mật và Kiểm soát Dữ liệu

Tính toàn vẹn của dữ liệu dự đoán được bảo vệ qua hai lớp kiểm soát thời gian nghiêm ngặt:

* Cơ chế Khóa Thời gian thực: Hệ thống tự động đóng quyền ghi dữ liệu đúng 15 phút trước giờ bóng lăn. Mọi yêu cầu gửi đến API trong cửa sổ này sẽ bị từ chối với mã lỗi 403 Forbidden.
* Xác nhận Dữ liệu Hậu trận đấu: Điểm số chỉ được xác nhận là "Finalized" sau 12 giờ kể từ khi trận đấu kết thúc. Khoảng thời gian này giúp xử lý triệt để các sai sót kỹ thuật hoặc khiếu nại, đảm bảo tính nhất quán tuyệt đối cho hệ thống bảng xếp hạng.

7. Hệ sinh thái Công nghệ hỗ trợ

Phần Frontend (Next.js)

* react-beautiful-dnd: Cung cấp tương tác kéo thả mượt mà với phản hồi xúc giác, hỗ trợ các thao tác trong Outright Markets.
* canvas-confetti: Hiệu ứng Micro-interaction chúc mừng trực quan khi người dùng đạt điểm tuyệt đối, củng cố vòng lặp phản hồi tích cực.
* react-countdown: Quản lý bộ đếm ngược thời gian thực chính xác để thực thi quy tắc khóa cổng 15 phút.

Phần Backend (NestJS)

* CronJob: Tự động kích hoạt các tiến trình xử lý điểm số theo lô sau khi trận đấu kết thúc.
* Cache Module: Tối ưu hóa các thao tác Read-heavy bằng cách lưu trữ dữ liệu xếp hạng nhóm (Group Leaderboards), đảm bảo tốc độ phản hồi cực nhanh cho hàng ngàn người dùng cùng lúc.
* passport-google-oauth20: Triển khai luồng đăng nhập Google SSO theo tiêu chuẩn bảo mật công nghiệp.

8. Thiết kế Giao diện (UI) Nhóm trên Mobile

Giao diện Mobile được tối ưu cho sự tương tác nhanh và giảm thiểu độ trễ truy cập:

* Multi-group Navigation: Thanh điều hướng cho phép chuyển đổi tức thì giữa các nhóm nhờ tận dụng kiến trúc N:M và cơ chế Hybrid Rendering của Next.js.
* Bảng xếp hạng nhóm (Leaderboard): Hiển thị theo đúng thứ tự ưu tiên Tie-break, tích hợp hiệu ứng hình ảnh sống động khi người dùng thăng hạng.
* Thẻ trận đấu (Match Cards): Hiển thị trạng thái động (Đang mở/Sắp đóng/Đã khóa) và tích hợp đếm ngược để cảnh báo cửa sổ 15 phút cuối cùng, thúc đẩy hành vi dự đoán.
* Tính năng Soi dự đoán: Cho phép xem nhanh dự đoán của các thành viên khác trong nhóm. Tính năng này sử dụng Cache Module để triệt tiêu độ trễ truy vấn, đảm bảo trải nghiệm mượt mà ngay cả trong giờ cao điểm.

9. Phân tích chi tiết Màn hình Dự đoán Dài hạn (Outright Markets)

Khu vực dự đoán dài hạn (Prophecy Area) là nơi tập trung các logic phức tạp, được đơn giản hóa qua các giải pháp kỹ thuật-giao diện:

* Cơ chế Kéo-Thả (Drag-and-drop): Sử dụng react-beautiful-dnd để thực hiện dự đoán "Đội vô địch" (Winner) và "Đội bị loại đầu tiên" (First Out). Thao tác kéo thả tự nhiên cung cấp Phản hồi xúc giác (Tactile feedback), giúp giảm Tải nhận thức (Cognitive load) cho người dùng khi đưa ra các lựa chọn quan trọng.
* Dự đoán Chiếc giày vàng (Golden Boot): Tích hợp tính năng tìm kiếm (search) mạnh mẽ, cho phép người dùng lọc nhanh cầu thủ từ danh sách lớn, tránh việc phải cuộn trang quá nhiều (excessive scrolling) gây khó chịu.
* Thứ hạng Vòng bảng: Quy trình sắp xếp thứ tự 4 đội trong mỗi bảng đấu được thực hiện qua tương tác kéo thả, tối ưu hóa việc đưa ra các quyết định chiến thuật nhanh chóng và chính xác.
* Phản hồi UX tổng thể: Sự kết hợp giữa kỹ thuật xử lý dữ liệu ngầm và phản hồi giao diện tức thì giúp biến các lựa chọn phức tạp trong khu vực "Prophecy Area" trở nên trực quan, tăng cường sự gắn kết của người dùng với hệ thống.
