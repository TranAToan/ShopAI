# PIN riêng ShopAI — cập nhật 09/10/2026

Theo yêu cầu mới, Android dùng PIN riêng 6 số của ShopAI thay cho PIN khóa màn hình hệ thống. Mã ban đầu là mã người dùng đã chọn trong cuộc hội thoại. Không đổi PIN khóa màn hình Android.

- `App.tsx` dùng `PinGateScreen`; đăng nhập mới cũng phải qua PIN.
- Khôi phục token và quay lại sau hơn 2 phút ở nền vẫn phải qua PIN.
- Bộ kiểm tra gồm salt và PBKDF2-HMAC-SHA256 120.000 vòng, được lưu bằng SecureStore. Không lưu PIN dạng văn bản.
- Sai 5 lần khóa thử PIN trong 30 giây. Số lần sai và thời hạn được lưu qua lần khởi động lại; sau ngưỡng này mỗi lần sai tiếp tục khóa 30 giây.
- Đăng xuất xóa token và trạng thái phiên, giữ bộ kiểm tra PIN để đăng nhập lại vẫn yêu cầu đúng PIN.
- Lỗi đọc/ghi dữ liệu, thiếu native module hoặc kết quả từ phiên cũ không mở khóa app.

Đây là PIN cố định ban đầu cho bản build cá nhân. Chưa có chức năng đổi/quên PIN. Bộ kiểm tra ban đầu nằm trong APK, nên PIN 6 số vẫn có thể bị dò ngoại tuyến nếu APK bị phân tích; không thay thế xác thực backend. Không có chức năng tự mở khóa bằng PIN Android.

Native PBKDF2 chỉ được triển khai cho Android; iOS chưa hỗ trợ màn hình PIN mới. Không nâng/hạ dependency.

Kiểm tra trên máy tính: TypeScript đạt; ESLint không có lỗi (27 cảnh báo); Jest 8 bộ, 62 kiểm tra đạt. Log tại `artifacts/lint-app-pin.txt`, `artifacts/tests-app-pin.txt`, `artifacts/jest-app-pin-results.json`.

Kiểm thử trên điện thoại sau khi cập nhật:

1. Mở lại app, nhập mã đã chọn, xác nhận vào được trang chủ.
2. Nhập sai hoặc để trống: vẫn khóa; ký tự PIN được che.
3. Sai 5 lần: tạm khóa 30 giây; đóng/mở lại trong khoảng đó vẫn bị chặn.
4. Ra nền dưới 2 phút: giữ phiên mở; hơn 2 phút: nhập PIN lại.
5. Đăng xuất và đăng nhập lại: phải nhập PIN; đóng/mở app vẫn khôi phục token qua cổng PIN.
6. Kiểm tra Hỏi AI, camera, GPS và giỏ hàng như trước.

Kiểm tra Jest chỉ mô phỏng native API. Xác thực PBKDF2 và bàn phím/màn hình thực tế cần thử trên điện thoại; Gemini thật chưa được gọi trong lần cập nhật này.
