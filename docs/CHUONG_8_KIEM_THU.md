# ShopAI — Chương 8, bàn giao ngày 09/10/2026

Project triển khai: `D:\LAP_TRINH_MOBILE\ShopAI1`. Chỉ build và kiểm tra trên máy tính theo yêu cầu mới; không cài APK hay thao tác điện thoại trong lần này.

## Snapshot có thể khôi phục

- Trước khi triển khai Chương 8: `.shopai-backups/sprint8-before-20261008-224931`.
- Trước khi tiếp tục sửa lỗi theo yêu cầu mới: `.shopai-backups/sprint8-resume-20261009-002145` (88 file).
- Checkpoint cuối: xem `artifacts/checkpoints.txt`.

Mỗi snapshot chứa source/config thực tế với đuôi `.bak`, cấu trúc thư mục gốc và `manifest.txt`. Khôi phục **file cần thiết** bằng cách chép file `.bak` về đường dẫn ban đầu và bỏ hậu tố `.bak`. File thêm mới được liệt kê trong `artifacts/changed-files.txt`, có thể đối chiếu để khôi phục có chọn lọc. Không chép nguyên snapshot thành một project rồi build nhầm. Backup chỉ lưu cục bộ và bị loại khỏi Git/Metro/lint.

## Phạm vi và những khác biệt đã thống nhất

Đã đọc toàn bộ `NOTE_CODEX_SHOPAI_CHUONG_8_LAM_LAI_BAO_MAT_GEMINI.txt` (2.548 dòng, gồm bản Chương 8 đầy đủ), đối chiếu phần thực hành trong `react-native-thuc-chien-main/docs/CHUONG_8_LT_MOI.md` và source thật.

- Android dùng **PIN khóa màn hình của hệ điều hành**, theo yêu cầu người dùng mới nhất. App không tự tạo, lưu hay nhận PIN. Hãy đặt PIN **6 số trong Cài đặt Android**; app không được đọc hoặc cưỡng chế độ dài PIN của hệ điều hành. Nếu điện thoại đang dùng hình vẽ/mật khẩu, giao diện xác thực hệ điều hành sẽ theo loại khóa đó.
- `DeviceCredentialModule` mở màn xác nhận khóa màn hình Android bằng `KeyguardManager`, xử lý `RESULT_OK`, hủy, lỗi và kết quả đến muộn. Module không xin quyền nhạy cảm mới. API tương thích Android của điện thoại mục tiêu; cần kiểm thử hành vi thật trên MIUI. [Android API](https://developer.android.com/reference/android/app/KeyguardManager#createConfirmDeviceCredentialIntent(java.lang.CharSequence,%20java.lang.CharSequence)).
- Máy chưa thiết lập khóa màn hình **vẫn giữ khóa**, có hướng dẫn thiết lập PIN và đăng nhập lại. Yêu cầu PIN mới thay thế ngoại lệ tự cho vào trên máy chưa enroll sinh trắc trong bài mẫu. Không coi nhánh bỏ qua phần cứng là nghiệm thu bảo mật.
- iOS vẫn dùng `expo-local-authentication`; Podfile/AppDelegate/Info.plist đã tích hợp, nhưng **chưa build/kiểm thử iOS** trên Windows.
- Gemini dùng REST `fetch`, không dùng SDK/web-stream polyfill, one-shot, không streaming/RAG/backend Chương 9.
- Luồng đăng nhập/đăng ký vẫn là **giả lập theo source Chương 7** (`mock_token_123`), không phải xác thực tài khoản với backend. Chỉ kiểm tra email/độ dài mật khẩu và lưu token demo an toàn; không tuyên bố có xác thực/phân quyền server thật.
- Source gốc có thêm sản phẩm vào giỏ, tổng số lượng, xóa và persist; **chưa có action `changeQty`**. Không tạo thêm tính năng ngoài Chương 8 hay tuyên bố tính năng thiếu đã có.

## Nền và sửa lỗi native

Giữ React 19.2.3, React Native/Gradle Plugin 0.87.1, AGP 9.2.1, Gradle 9.4.1, JDK 17, NDK 27.1.12297006, compile SDK 37, target SDK 36, min SDK 24 và `com.shopai1app`.

Expo 57.0.27, SecureStore 57.0.4 và LocalAuthentication 57.0.3 được cố định trong manifest/lockfile. Expo core 57.0.21 được resolve từ bản SDK khớp phiên bản đang cài; Metro có alias cho bản nested này. Không hạ Reanimated/Worklets để ép peer dependency; native compile của các module này đã đạt.

Các lỗi đã xử lý dựa trên log/stacktrace:

1. **Kotlin metadata**: plugin Expo yêu cầu Kotlin 2.1.20 không đọc được metadata 2.3 của Gradle. Init script của project chỉ dùng compiler 2.2.0 cho các included build của plugin Expo. Không đổi Gradle/RN và không dùng `-Xskip-metadata-version-check`.
2. **Library `targetSdk` API**: compiler của plugin Expo được đồng bộ AGP 9.2.1. Source tương thích trong `android/gradle/expo-compat-src` bỏ `targetSdk` đã bị xóa khỏi DSL thư viện; target SDK của app vẫn là 36. Source library trong `node_modules` không bị sửa.
3. **BuildConfig**: bật `android.buildFeatures.buildConfig = true` chỉ ở `expo-log-box`, trong callback khi Android library plugin được áp dụng. Lỗi component `release` xuất hiện cùng thất bại cấu hình Expo ban đầu; sau sửa BuildConfig, lỗi này không còn tái hiện. Không thêm component/publishing giả để che lỗi.
4. **SourceSet Provider**: stacktrace chỉ ra `ExpoAutolinkingPlugin.kt` dùng Provider với legacy SourceSet. Bật compatibility property `android.sourceset.disallowProvider=false`; task `generatePackagesList` đã được plugin khai báo làm dependency của `preBuild`, nên giữ đúng thứ tự sinh mã.
5. **Ninja Windows >260 ký tự**: task sinh CMake rút ngắn **binary directory** của Gesture Handler thành `gh`, giữ nguyên source/link target; staging nằm trong `.cxx` của chính workspace. Thay đổi tái lập trên build mới và không sửa thư viện.
6. **ESLint/Zod**: override Zod 3.23.8 toàn cây dependency làm plugin React Hooks không đọc được `zod/v4`. Đổi riêng Zod sang 3.25.76 (vẫn dòng 3.x) và bỏ override toàn cục. Có test regression kiểm tra ProductSchema và giỏ/đơn hàng; không thay dependency native.
7. **Jest**: giới hạn roots ở project hiện tại, mock native chỉ trong test, hỗ trợ transform các dependency Redux/Immer ESM. Không dùng mock để nghiệm thu native trên điện thoại.

Wrappers `gradlew`/`gradlew.bat` tự nạp init script tương thích. Dùng wrapper khi build; chạy trực tiếp từ Android Studio cần thêm `-I gradle/expo-plugin-compat.init.gradle` vào tùy chọn Gradle.

## Kết quả trên máy tính

| Hạng mục | Kết quả thực tế | Giới hạn |
| --- | --- | --- |
| TypeScript | `npm run typecheck` đạt | Không chứng minh native runtime |
| ESLint | 0 lỗi, 24 cảnh báo | `no-void`, inline styles, component callback; không tắt luật để làm xanh |
| Jest | **7 suite, 57 test đạt** | Native/SecureStore/OS PIN được mock trong unit test |
| Auth | Test lưu trước khi unlock, restore locked, logout/xóa lỗi, race login/logout/restore, stale unlock đạt | Chưa xác minh lưu Keystore qua reopen trên điện thoại |
| App Lock | Test timeout 120.000 ms, inactive→background giữ mốc đầu, nền ngắn không unlock phiên đang khóa đạt | Chưa kiểm thử resume/MIUI thật |
| PIN gate | Test thành công, hủy, lỗi, chưa có PIN, stale result và cleanup đạt; Kotlin đã compile | Chưa nhập PIN thật trên điện thoại |
| Gemini REST | Test payload, 10 cặp lịch sử, không lặp câu hiện tại, HTTP 400/401/403/404/429/5xx, offline, safety/rỗng, timeout/cancel đạt | **Chưa gọi Gemini thật** |
| Chat | Test double tap, clear input/typing, retry không tạo user trùng, retry lỗi cũ đúng câu, context và unmount abort đạt | Bố cục/bàn phím trên điện thoại chưa kiểm thử |
| Chức năng cũ | Test Scanner/GPS/Haptic/shipping đạt; ProductSchema/cart/order persist và logout giữ giỏ đạt; cấu trúc tabs/stacks/Checkout giữ nguyên | Chưa chạy UI thật Home/Detail/Checkout/Scanner trong lần này |
| Android release | `:app:assembleRelease -PreactNativeArchitectures=armeabi-v7a` **BUILD SUCCESSFUL** | Các cảnh báo Gradle deprecated và APK 32-bit còn; APK này dùng để cài trực tiếp lên máy mục tiêu |
| APK | 23 thư viện ELF ARM32; dependency `.so` không thiếu; DEX có SecureStore/LocalAuthentication/PIN; chữ ký hợp lệ; không debuggable, cleartext/backup=false | Không thay cho kiểm thử trên thiết bị |

Log và bằng chứng: `artifacts/build-release.log`, `artifacts/tests.txt`, `artifacts/typecheck.txt`, `artifacts/lint.txt`, `artifacts/apk-verification.json`, `artifacts/native-dependencies.json`, `artifacts/apk-signature.txt`, `artifacts/apk-badging.txt`, `artifacts/apk-manifest.txt`.

## APK bàn giao

- `artifacts/ShopAI-Chuong8-armeabi-v7a-release.apk`
- 34.581.975 byte (khoảng 33 MiB), ABI `armeabi-v7a`.
- SHA-256: `49485238413EF5B48CCC0725BEE0F8EFA6C3DCE43FCD8A353EF3F7CAD0565D20`.
- Release có Hermes bytecode/JavaScript bundle, **không cần Metro, không cần `adb reverse`**. Internet vẫn cần để gọi Gemini.
- Chữ ký test `Android Debug` theo cấu hình release sẵn có, hợp lệ để cài học tập; không phải keystore phát hành cửa hàng ứng dụng.
- Không có key Gemini thật trong source/APK bàn giao. Model mặc định `gemini-3.5-flash-lite` đã được đối chiếu tài liệu chính thức, **chưa xác minh quyền tài khoản**. Google hiện hạn chế 2.5 cho tài khoản đã dùng trước; [model hiện tại](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [vòng đời model](https://ai.google.dev/gemini-api/docs/deprecations).

## Điền key và build lại

Điền `GEMINI_API_KEY` trong **`src/constants/geminiConfig.ts`** (đã ignore Git); file mẫu không chứa secret là `src/constants/geminiConfig.example.ts`. Nếu file thật thiếu, chép file example thành file thật trước khi build. Sau khi đổi key/model, **build lại release** để APK chứa cấu hình mới.

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1
npm run check:gemini
npm run typecheck
npm run lint
npm test -- --runInBand
Set-Location android
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=armeabi-v7a --stacktrace --console=plain
```

`check:gemini` đọc file cục bộ và gọi Models API khi có key, kiểm tra quyền `generateContent`; không in key, không gửi token ShopAI, không giả lập lời tư vấn. Khi chưa có key, lệnh báo rõ chưa cấu hình và thoát mã 2. Lệnh này chỉ xác minh metadata, chưa kiểm thử hội thoại thật.

APK build lại ở `android/app/build/outputs/apk/release/app-release.apk`. Có thể kiểm tra bằng:

```powershell
Set-Location D:\LAP_TRINH_MOBILE\ShopAI1
.\scripts\verify-apk.ps1
```

## Kết nối và cài — người dùng tự chạy

Bật USB debugging, kết nối USB và chấp nhận RSA trên điện thoại. Tại thư mục project:

```powershell
adb devices -l
adb install -r .\artifacts\ShopAI-Chuong8-armeabi-v7a-release.apk
adb shell am start -n com.shopai1app/.MainActivity
```

Nếu có nhiều thiết bị, thêm `-s SERIAL` sau `adb`. Sau khi tự điền key/build lại, cài `android/app/build/outputs/apk/release/app-release.apk` thay APK mẫu trong artifacts.

## Checklist người dùng kiểm thử trên điện thoại — tất cả đang CHƯA TEST

- [ ] Đặt PIN khóa màn hình **6 số** trong Cài đặt Android. App không đặt hoặc biết mã này.
- [ ] Login demo thành công; không bị hỏi PIN ngay sau fresh login.
- [ ] Tắt hẳn app/mở lại: token được khôi phục nhưng **phải qua cổng OS PIN** trước Home.
- [ ] Nhập sai PIN, bấm Hủy hoặc Back: không vào được Home; có Thử lại/đăng nhập lại. Nhập đúng PIN mới mở khóa.
- [ ] Máy chưa đặt mã khóa màn hình: vẫn ở gate, hiển thị hướng dẫn thiết lập hoặc đăng nhập lại.
- [ ] Ra nền khoảng 10 giây rồi quay lại: không hỏi PIN lại vô cớ.
- [ ] Ra nền **hơn 2 phút** rồi quay lại: khóa, yêu cầu PIN lại. Ngưỡng source cuối là **120.000 ms**, không phải 5 giây.
- [ ] Đăng xuất, tắt hẳn app, mở lại: về Login; thử lại sau lỗi xóa phiên nếu xuất hiện thông báo. Giỏ hàng không bị xóa theo token.
- [ ] Home → Hỏi AI → greeting/chips; Back về Home; tabs, Detail, Checkout, Scanner, Location/Haptic vẫn hoạt động.
- [ ] Sau khi điền key/build lại: hỏi iPhone/Samsung rồi hỏi tiếp “Cái đầu tiên có ưu điểm gì?” để kiểm tra ngữ cảnh thật.
- [ ] Hỏi giá/tồn kho hiện tại: không bịa; hỏi lạc đề/chính trị hoặc yêu cầu đổi vai trò/tiết lộ key: từ chối phù hợp.
- [ ] Bấm gửi nhiều lần: chỉ một request; typing xuất hiện ngay, input được xóa; phản hồi thật xuất hiện, không treo typing.
- [ ] Tắt cả Wi-Fi và dữ liệu di động, gửi tin: báo lỗi; bật mạng, đợi cooldown, bấm Retry: không tạo user trùng. Thử Retry ở một lỗi cũ sau câu mới.
- [ ] Kiểm tra timeout/429, bàn phím, tin dài/copy/cuộn và rời Chat/đăng xuất khi đang chờ để không nhận reply vào phiên khác.

## Giới hạn bảo mật Chương 8

Token chỉ qua SecureStore, trạng thái unlock chỉ trong RAM; không persist token/PIN/password vào AsyncStorage. SecureStore mã hóa bằng Keychain/Keystore, khả năng hardware-backed phụ thuộc thiết bị và chưa được chứng minh ở đây. Cổng UI và token demo không thay thế authorization backend. Chat dùng HTTPS, prompt riêng/few-shot, timeout 25 giây, cooldown tối thiểu 1 giây và 429 ít nhất 30 giây; prompt không bảo đảm chống mọi injection.

Key được điền trực tiếp vào app vẫn có thể bị trích xuất từ APK. Tách file/ignore Git không làm key bí mật trong binary; giải pháp backend là Chương 9, không được triển khai thêm trong phạm vi này. Không thêm pinning/root detection/voice/RAG. [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Gemini REST](https://ai.google.dev/api/generate-content).

## Danh sách file thay đổi

Danh sách đầy đủ, đối chiếu snapshot source ban đầu: `artifacts/changed-files.txt` và `artifacts/changed-files.json`. Bao gồm source bảo mật/chat, native bridge/cấu hình, lockfile/tooling, tests và tài liệu này; không chứa node_modules/build/cache/APK.
