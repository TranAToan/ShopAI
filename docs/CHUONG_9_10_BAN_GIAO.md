# ShopAI Chương 9–10 — bàn giao 15/10/2026

Project: `D:\LAP_TRINH_MOBILE\ShopAI1`, Android ID `com.shopai1app`. Giữ PIN riêng theo xác nhận mới nhất của người dùng, SecureStore và App Lock 2 phút. Không cài APK hay nhập PIN trên điện thoại trong đợt này.

Không tìm thấy `CHUONG_9_LT_MOI(1).md`/`CHUONG_10_LT_MOI(1).md`. Đã đọc toàn bộ bản không hậu tố trong `react-native-thuc-chien-main/docs/` và lệnh giao việc trong Downloads; triển khai theo checklist và yêu cầu trực tiếp của người dùng.

## Chương 9

- Backend riêng `shopai-backend`: Nest Controller/Service/Module, DTO/ValidationPipe, Swagger, Helmet, Throttler.
- Products: 20 ID ổn định, list/detail/404; mobile vẫn dùng Zod.
- Auth: register/login bcrypt/JWT thật, email trùng 409, sai mật khẩu 401; token lưu SecureStore.
- Prisma SQLite: migrate/seed, repository, quyền sở hữu đơn; quantity nguyên, đối chiếu tổng server, snapshot giá; PENDING → PAID giả lập.
- Idempotency phía server và chặn bấm trùng phía mobile, giữ giỏ khi lỗi. Cache orders/order theo session và xóa cache khi chuyển phiên.
- AI REST chuyển hoàn toàn xuống backend, giữ UX chat Ch8. API key/config Gemini đã xóa khỏi source mobile; bản backup và APK cũ được giữ riêng ngoài bundle.
- Lượt Gemini thật ngày 15/10 trả 200, giá Điện thoại ShopAI 1 là 1.000.000 VND đúng catalog: `artifacts/chapter9-10/gemini-live.json`.

**Lưu ý cập nhật:** token demo giả từ bản cũ không hợp lệ với backend mới. App sẽ đăng xuất khi API được bảo vệ trả 401; đăng nhập `demo@shopai.com` / `123456` hoặc đăng ký tài khoản. Giỏ cũ vẫn được giữ, nhưng ID mock cũ có thể không tồn tại trong catalog Nest; cần bỏ các món cũ và thêm lại. Lịch sử đơn local cũ không tự nhập vào database thật; store cũ vẫn được giữ trong source/dữ liệu backup.

## Chương 10 và các phần cần tài khoản thật

Có `env.ts` và `api.ts` tái xuất, môi trường native rõ ràng; APK local mặc định staging, không dựa `__DEV__` để trỏ domain mẫu. Production yêu cầu URL HTTPS thật. Profile EAS development/preview/production có channel tương ứng, runtime 1.1.0. Không có project ID giả.

Crashlytics SDK và code ghi lỗi/breadcrumb đã thêm. Chỉ ghi tên thao tác, trạng thái và số lượng; không gửi raw AxiosError/config, token, key, PIN, mật khẩu hay nội dung chat. Lỗi giám sát không được làm hỏng mua hàng. Test crash chỉ cho development và bật collection rõ ràng khi test.

**BLOCKED: Firebase chưa có cấu hình thật.** Không tìm thấy `android/app/google-services.json`; chưa nhận crash/non-fatal trên Firebase, chưa upload mapping. Khi chưa có file đúng, plugin và collection không bật để vẫn build/test được.

Bạn cần làm:

1. Mở [Firebase Console](https://console.firebase.google.com/), tạo/chọn project → Add app Android.
2. Nhập package **`com.shopai1app`**, tải `google-services.json` vào `android/app/`. Không đổi package ID của app đang cài.
3. Mở Crashlytics trong Firebase. Build lại; Gradle tự kiểm tra package trong JSON và bật Google Services + Crashlytics plugin, release mapping upload.
4. Chạy bản development, nhấn giữ dòng phiên bản 2 giây; mở lại app, đợi báo cáo xuất hiện trên Console. Chỉ đánh PASS sau khi thấy báo cáo.
5. Với bản staging đã có config, gây lỗi fetch/checkout bằng cách dừng backend, giữ giỏ, mở lại app và xác nhận Non-Fatal tương ứng trên Console.

**BLOCKED: chưa liên kết tài khoản/dự án Expo.** SDK và hook OTA đã thêm; native OTA bị tắt khi không có project ID thật. Chưa publish/download/rollback update thật.

```powershell
npx eas-cli login
npx eas-cli init
# Nếu EAS báo dynamic app config: lấy UUID project thực trên expo.dev.
$env:EXPO_PROJECT_ID = 'UUID_DU_AN_THAT_CUA_BAN'
npx eas-cli project:info
```

`app.config.js` đọc UUID từ biến môi trường; không tự sửa cấu trúc native bằng prebuild. Local Gradle cũng đọc `EXPO_PROJECT_ID`. Sau khi liên kết, build native lại một lần, giữ cùng project ID khi build và publish. Dự án bare RN dùng ExpoReactHostFactory và Expo Metro để hỗ trợ Updates; không chạy `prebuild --clean`.

```powershell
# Native test build phải có channel staging và runtime 1.1.0.
npx eas-cli channel:create staging --branch staging
npx eas-cli update --branch staging --platform android --message 'ShopAI staging test'
npx eas-cli update:list --branch staging
# Rollback: republish một group đã xác nhận tốt, hoặc chuyển channel sang branch an toàn.
npx eas-cli update:republish --group UPDATE_GROUP_ID --branch staging
npx eas-cli channel:edit staging --branch staging-safe
```

Update tải xong sẽ áp dụng lần khởi động sau, không tự reload lúc đang nhập PIN/đặt hàng/chat. OTA chỉ đổi JS/assets tương thích; thêm module native phải đổi runtime và build native mới. Không bật/publish production khi chưa có server thật và kiểm thử staging.

## Signing, build và cập nhật

Bản cũ dùng debug keystore project. APK cập nhật giữ chữ ký đó để `adb install -r` giữ dữ liệu. Keystore phát hành mới ở `secrets/shopai-release.p12`, mật khẩu trong `secrets/signing.properties`, có bản sao local `secrets/backup/`; tất cả bị loại khỏi Git/EAS upload. Bạn cần sao lưu thêm ra nơi mã hóa ngoài máy. Không gửi mật khẩu lên chat.

AAB dùng keystore phát hành mới; **không dùng nó để cài đè APK cũ**. AAB staging là artifact kiểm thử, chưa phải bản production/đã nộp Play Store. Version 1.1.0 / code 10100; R8 + shrink resources bật. Mapping và sourcemap phải lưu theo từng artifact phát hành.

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1
# APK tương thích chữ ký cũ, ARM32 M2006C3LG:
.\scripts\build-android.ps1 -Environment staging
# AAB ký bằng keystore phát hành, gồm ARM32 và ARM64:
.\scripts\build-android.ps1 -Environment staging -Bundle
# Production chỉ dùng khi có backend HTTPS thật:
.\scripts\build-android.ps1 -Environment production -ApiUrl 'https://BACKEND_THAT' -Bundle
```

Chạy backend: xem [shopai-backend/README.md](../shopai-backend/README.md). Điện thoại mở `http://192.168.20.69:3000/api/health` để xác nhận mạng trước. Nếu IP Wi-Fi thay đổi, chỉnh LAN URL trong `src/constants/env.ts`, build lại hoặc truyền `-ApiUrl`. Chỉ cho phép cổng 3000 trên mạng tin cậy khi Windows Firewall hỏi. Mạng trường có thể chặn thiết bị truy cập nhau.

USB thay cho LAN: build APK test với `-ApiUrl 'http://127.0.0.1:3000'`, sau đó chạy `adb reverse tcp:3000 tcp:3000` trước khi mở app. APK mặc định dùng LAN, không tự chuyển localhost chỉ bằng adb reverse.

```powershell
adb devices -l
adb install -r "D:\LAP_TRINH_MOBILE\ShopAI1\artifacts\chapter9-10\ShopAI-1.1.0-staging.apk"
adb shell am start -n com.shopai1app/.MainActivity
```

APK release có bundle Hermes, không cần Metro; backend và Internet vẫn cần chạy cho các chức năng mạng.

## Checklist điện thoại — CHƯA KIỂM THỬ trong đợt này

- PIN đúng/sai, đóng mở app khôi phục token vẫn khóa, vào nền dưới/trên 2 phút, logout và đăng nhập lại.
- Register user mới, email trùng, mật khẩu sai; đổi user không thấy đơn của user trước.
- Products/detail/search/filter, giỏ, tạo đơn PENDING, lịch sử, chi tiết, pay PAID, mở lại app.
- Tắt backend khi checkout: lỗi hiện, giỏ còn, retry; bấm nhanh hai lần chỉ tạo một đơn.
- Gemini nhớ ngữ cảnh, typing, retry, hỏi giá theo catalog, lỗi mạng; camera/GPS/navigation/theme vẫn hoạt động.
- Firebase: chỉ đánh PASS khi Dashboard nhận fatal/non-fatal thật; production không có nút crash.
- Expo: chỉ đánh PASS khi staging nhận update thật, đúng runtime/channel, rollback đã quan sát.

iOS chưa build/test: máy Windows, chưa có cấu hình Firebase iOS hay Apple Developer. Docker/Redis/Sentry/cổng thanh toán thật không được thêm vào scope.

## Tài liệu chính thức đã đối chiếu

- [Nest authentication](https://docs.nestjs.com/security/authentication), [throttling](https://docs.nestjs.com/security/rate-limiting)
- [Prisma SQLite](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Expo Updates cho React Native hiện có](https://docs.expo.dev/bare/installing-updates/)
- [Firebase Crashlytics Android](https://firebase.google.com/docs/crashlytics/android/get-started), [RN Firebase](https://rnfirebase.io/crashlytics/usage)

Kết quả build cuối, hash, kiểm tra APK/AAB và danh sách file sửa được ghi trong thư mục `artifacts/chapter9-10` khi hoàn tất kiểm tra thực tế.

## Ket qua build va kiem tra thuc te - 2026-10-16

- Mobile TypeScript: PASS (`npm run typecheck`). Mobile Jest: PASS, 11 suites / 55 tests. Mobile ESLint: PASS, 0 errors, 42 warnings (cac canh bao no-void/no-inline-styles va nested component).
- Backend build/lint da chay truoc do; kiem tra cuoi backend: PASS, 13/13 test, bao gom JWT, ownership, total tamper, pay, idempotency, SQLite sau restart va AI timeout/rate limit. Gemini live da duoc goi truoc do va tra loi du lieu catalog that; health hien tai HTTP 200.
- APK: PASS verifier, 30,649,082 bytes, armeabi-v7a, Hermes, signature trung artifact Chuong 8, khong co Gemini key/provider endpoint, khong can Metro. SHA-256: 15BA7FF9650C1E85F6265FEE5CCF30E3F14DA59B7A3292908A9B82EDA4D0F9D6.
- AAB staging: da build va `jarsigner -verify` bao `jar verified`; bundle co ca arm64-v8a va armeabi-v7a. SHA-256: A986032F9F1F6810628032F2685106BF4A0F4AB3C (xem Get-FileHash de lay day du). Chu ky AAB dung keystore phat hanh moi, khong cai de len ban cu. Day la staging, chua phai production.
- Firebase: BLOCKED do chua co `android/app/google-services.json` khop `com.shopai1app`; Crashlytics chua duoc xac minh tren Firebase Console. Expo OTA: BLOCKED do chua co Expo project UUID / EAS lien ket; chua publish hay nhan OTA that. Khong co thong tin gia.
- Chua kiem thu PIN, App Lock, logout, checkout/chat va ket noi tren dien thoai; can ban tu cai va chay checklist ben tren. iOS chua build tren Windows.
- APK: `artifacts/chapter9-10/ShopAI-1.1.0-staging.apk`. AAB: `artifacts/chapter9-10/ShopAI-1.1.0-staging.aab`. Mapping va sourcemap tuong ung nam cung thu muc artifact.
- Mốc sao luu hoan tat: `.shopai-backups/chapter9-10-final-2026-10-16T14-52-35-032Z`.