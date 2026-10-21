# NOTE TỔNG HỢP SHOPAI

## Source hiện tại

- Project mobile: `D:\LAP_TRINH_MOBILE\ShopAI1`
- Backend: `D:\LAP_TRINH_MOBILE\ShopAI1\shopai-backend`
- Package Android: `com.shopai1app`
- PIN riêng ShopAI hiện tại: `666666`

## Backup

Thư mục backup: `D:\LAP_TRINH_MOBILE\ShopAI1\.shopai-backups`

- Trước Chương 9–10: `.shopai-backups\before-chapter9-10-2026-10-15T07-01-33-981Z`
- Sau Chương 9: `.shopai-backups\chapter9-verified-2026-10-15T07-18-19-751Z`
- Bản mới nhất: `.shopai-backups\chapter9-10-final-2026-10-16T14-52-48-876Z`

## Đã hoàn thành

- SecureStore, PIN khóa app, App Lock 2 phút, logout xóa phiên.
- Backend NestJS + Prisma SQLite, Auth JWT/bcrypt, sản phẩm, đơn hàng, thanh toán giả lập.
- Gemini chuyển xuống backend; mobile không còn giữ API key hay gọi Google trực tiếp.
- Catalog 20 sản phẩm, kiểm tra giá/tổng tiền/phân quyền đơn hàng/idempotency.
- Expo Updates, Crashlytics và R8 đã cấu hình phần độc lập.
- Mobile test: 55/55 đạt; backend test: 13/13 đạt; typecheck đạt; lint 0 lỗi và 42 cảnh báo.

## File build

- APK cập nhật điện thoại: `artifacts\chapter9-10\ShopAI-1.1.0-staging.apk`
- AAB staging: `artifacts\chapter9-10\ShopAI-1.1.0-staging.aab`
- APK có `armeabi-v7a`, chữ ký khớp bản cũ, không cần Metro.
- APK SHA-256: `15BA7FF9650C1E85F6265FEE5CCF30E3F14DA59B7A3292908A9B82EDA4D0F9D6`
- AAB SHA-256: `A986032F9F1F6810628032F2685106BF4A0F4AB3C4F1C2E6EB4198BA2FA7AD15`

## Chạy backend

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1\shopai-backend
npm ci
npx prisma generate
$env:PRISMA_SCHEMA_ENGINE_BINARY = (Resolve-Path node_modules\@prisma\engines\schema-engine-windows.exe).Path
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Điện thoại dùng backend LAN: `http://192.168.20.69:3000`.

## Cài APK cập nhật

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1
adb install -r .\artifacts\chapter9-10\ShopAI-1.1.0-staging.apk
adb shell am start -n com.shopai1app/.MainActivity
```

## Còn cần làm trên máy/dịch vụ bên ngoài

- Chưa kiểm thử thực tế trên điện thoại: PIN đúng/sai, App Lock, logout, checkout và Gemini.
- Firebase Crashlytics chưa nghiệm thu vì thiếu `android\app\google-services.json` đúng package.
- Expo OTA chưa nghiệm thu vì chưa liên kết Expo project/EAS project ID.
- AAB hiện là staging, chưa phải bản production đưa lên Play Store.

## Tài liệu bàn giao đầy đủ

`docs\CHUONG_9_10_BAN_GIAO.md`
