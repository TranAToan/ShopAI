# ShopAI backend — Chương 9

## Deploy công khai để điện thoại không phụ thuộc máy tính

Backend có thể deploy bằng Docker trên Render. `../render.yaml` cấu hình vùng Singapore,
HTTPS, health check và ổ đĩa persistent cho SQLite. Ổ đĩa cần thiết để User/Order không
bị xóa khi app backend restart/redeploy; vì vậy cấu hình dùng gói web trả phí và 1 GB disk.
Giá hiện hành cần xem trên trang Render trước khi tạo dịch vụ. Không dùng free filesystem
cho dữ liệu đơn hàng vì filesystem đó có thể mất khi restart.

1. Đẩy các thay đổi source này lên nhánh GitHub mà Render có quyền đọc; không thêm `.env`,
   `shopai-backend/.env`, database, keystore hoặc file signing vào commit.
2. Tạo Blueprint mới trên Render từ repository `TranAToan/ShopAI`, chọn `render.yaml` ở root.
3. Khi được hỏi `GEMINI_API_KEY`, nhập key vào ô Secret của Render Dashboard. Không đưa key
   vào file YAML, GitHub, APK hoặc chat. Render tự tạo `JWT_SECRET`.
4. Chờ deploy thành công, kiểm tra `https://<hostname-render>/api/health` trả HTTP 200 và
   mở `/api/docs`. Tạo tài khoản mới trong app; không seed tài khoản demo `123456` lên server công khai.
5. Build APK trỏ tới API HTTPS vừa nhận. Chọn `production` để tắt cleartext HTTP:

   ```powershell
   Set-Location D:\LAP_TRINH_MOBILE\ShopAI1
   .\scripts\build-android.ps1 -Environment production -ApiUrl 'https://<hostname-render>'
   ```

   Lệnh này tạo APK release có bundle JS/Hermes, không cần Metro, và giữ backend/key ở server.
   APK cài trực tiếp vào máy cần giữ đúng chữ ký ứng dụng hiện tại; kiểm tra gói và mapping
   bằng `scripts/verify-apk.ps1 -ApkPath artifacts/chapter9-10/ShopAI-1.1.0-production.apk
   -MappingPath artifacts/chapter9-10/mapping-1.1.0-production-apk.txt` trước khi cài.

Chỉ chạy migration `prisma migrate deploy` khi backend khởi động. Dữ liệu SQLite cũ đang ở
máy tính không tự chuyển lên cloud; nếu cần giữ tài khoản/đơn hàng cũ, phải xuất và nhập
database trước khi chuyển app sang API mới.

Chạy riêng với Node 24 (máy hiện tại). Nest 11, Prisma 6.19 và SQLite; dependency backend không đổi RN/Expo của mobile. Prisma 6 được pin để dùng schema/CommonJS đúng giáo trình, không tự chuyển sang Prisma 7/8.

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1\shopai-backend
npm ci
npx prisma generate
# Máy này đã có .env riêng. Trên máy khác: Copy-Item .env.example .env rồi điền bí mật.
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Server lắng nghe `0.0.0.0:3000`, Swagger `/api/docs`, health `/api/health`. Máy này dùng Wi-Fi LAN `192.168.20.69`; địa chỉ có thể đổi khi đổi mạng. Điện thoại và máy tính cần truy cập được nhau; firewall/AP isolation có thể ngăn kết nối dù backend chạy tốt.

Demo: `demo@shopai.com` / `123456`. Đây là tài khoản học tập. Đăng ký tài khoản khác từ app hoặc Swagger. Password hash bcrypt, JWT ký HS256 và kiểm tra hết hạn. Production phải đổi tài khoản demo/bí mật và triển khai HTTPS.

`POST /api/orders` chỉ nhận `items` + `total`, JWT bắt buộc. Header `Idempotency-Key` cho phép retry cùng dữ liệu nhận lại một đơn; đổi dữ liệu với cùng key bị 409. Server tra giá catalog, lưu snapshot và tự tính tổng. List/detail/pay lọc theo chủ sở hữu; đơn người khác trả 404. Pay là giả lập, có thể gọi lại mà không thanh toán trùng.

Catalog 20 sản phẩm in-memory có ID ổn định; User/Order/OrderItem lưu SQLite. `POST /api/products` là endpoint minh họa validation, không phải chức năng quản trị catalog.

AI dùng Gemini REST trên backend, key chỉ trong `.env`. Prompt chứa catalog hiện tại, lịch sử tối đa 10 cặp; giới hạn input 500 ký tự, timeout 25 giây, giới hạn API 5 lần/phút. Client nhận `{reply}`; không trả chi tiết lỗi provider chứa thông tin nhạy cảm.

```powershell
npm run typecheck
npm run lint
npm test
npm run check:gemini
node scripts/live-smoke.cjs
```

Test HTTP tạo database riêng dưới `test/`, chạy server cổng 3101 và restart thực tế. Không dùng hay xóa database `prisma/dev.db`. `live-smoke` là một lượt gọi Gemini thật, có thể dùng hạn mức, không in token/key.

Nếu Prisma trên Windows báo lỗi engine/download, dùng engine đã tải:

```powershell
$env:PRISMA_SCHEMA_ENGINE_BINARY = (Resolve-Path node_modules\@prisma\engines\schema-engine-windows.exe).Path
npm run db:migrate
```

Không commit `.env`, `*.db*`, không đưa JWT/key lên web decoder. Migration và `.env.example` được giữ trong source. Sao lưu database khi server đã dừng hoặc dùng chức năng backup SQLite phù hợp.
