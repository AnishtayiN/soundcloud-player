# امنیت · Security

## ورود و توکن برنامه (Android / Windows)

| موضوع | رفتار فعلی |
|---|---|
| ساخت توکن | بعد از «تایید ورود» در ربات، سرور یک توکن تصادفی ۳۲ بایتی می‌سازد. فقط **هش SHA-256** آن در جدول `app_sessions` ذخیره می‌شود؛ خود توکن هیچ‌جا روی سرور نگه داشته نمی‌شود. |
| کد ورود | کد نمایش‌داده‌شده در برنامه **۱۰ دقیقه** اعتبار دارد و **یک‌بار مصرف** است (بعد از استفاده پاک می‌شود). |
| طول عمر توکن | توکن **تاریخ انقضا ندارد**؛ تا وقتی از برنامه خارج نشوید معتبر می‌ماند. `last_seen` حداکثر هر ۶ ساعت به‌روز می‌شود. |
| ابطال (Revoke) | «خروج» در برنامه ← `POST /api/auth/logout` ← ردیف همان نشست از `app_sessions` حذف می‌شود. هر درخواست بعدی با آن توکن `401` می‌گیرد و برنامه خودش به صفحه‌ی ورود برمی‌گردد. |
| ابطال از راه دور | فعلاً ربات دکمه‌ی «خروج از همه‌ی دستگاه‌ها» ندارد. اگر دستگاهی گم شد، مدیر می‌تواند نشست‌های آن کاربر را با `delete from app_sessions where user_id = …` باطل کند. |
| محل نگه‌داری | `localStorage` با کلید `sc_token` داخل پروفایل WebView (اندروید: پوشه‌ی خصوصی برنامه) یا Electron (ویندوز: `%APPDATA%\SoundCloud Player`). محل ذخیره عوض نشده، پس مهاجرتی لازم نیست. اگر روزی به Keystore / safeStorage منتقل شود، باید در اولین اجرا مقدار قدیمی `localStorage` پاک شود. |
| نام دستگاه | اندروید «سازنده + مدل» و ویندوز فقط نسخه‌ی ویندوز (مثلاً `Windows 10`) را می‌فرستد؛ نام کامپیوتر (hostname) دیگر ارسال نمی‌شود. |

## پشتیبان‌گیری اندروید

`android:allowBackup="false"` و علاوه بر آن `fullBackupContent` (اندروید ۱۱ و قدیمی‌تر) و `dataExtractionRules` (اندروید ۱۲ به بعد، هم پشتیبان ابری و هم انتقال به دستگاه جدید) **همه‌ی** دامنه‌ها را مستثنا می‌کنند. یعنی داده‌ی WebView (`sc_token`، کش آفلاین، تنظیمات) نه در Google Drive و نه با `adb backup` و نه در انتقال دستگاه کپی می‌شود. بعد از نصب روی گوشی جدید فقط باید دوباره وارد شوید.

## آپدیت داخل برنامه

1. نسخه‌ی جدید باید به‌شکل `x.y.z` و **دقیقاً جدیدتر** از نسخه‌ی نصب‌شده باشد.
2. آدرس دانلود از روی نسخه ساخته می‌شود (`…/releases/download/v<نسخه>/`) و فقط نام‌های ثابت `SoundCloud-Player.apk` و `SoundCloud-Player-Setup.exe` پذیرفته می‌شوند.
3. فایل `SHA256SUMS` همان Release (که CI می‌سازد) دانلود و هش فایل با آن مقایسه می‌شود. Release بدون `SHA256SUMS` نصب خودکار ندارد و فقط صفحه‌ی دانلود را باز می‌کند.
4. اندروید علاوه بر این نام بسته، `versionName`، `versionCode` بزرگ‌تر و گواهی امضا را داخل APK بررسی می‌کند.
5. هیچ نصبی خودکار شروع نمی‌شود: بعد از «تایید شد» کاربر باید دکمه‌ی «نصب» را بزند. درست قبل از نصب، هش دوباره بررسی می‌شود.

> محدودیت: `SHA256SUMS` کنار همان فایل‌ها در GitHub Releases منتشر می‌شود، پس جلوی کسی که به حساب GitHub یا Release دسترسی پیدا کند را نمی‌گیرد. در اندروید سیستم‌عامل خودش آپدیتی که با کلید دیگری امضا شده باشد را رد می‌کند. در ویندوز نصب‌کننده امضای Authenticode ندارد.

## امضای نسخه‌ها

- Release (تگ `v*` یا اجرای دستی) **بدون** secret `ANDROID_KEYSTORE_B64` شکست می‌خورد. Gradle هم با `RELEASE_BUILD=true` بدون keystore خطا می‌دهد.
- کلید debug فقط برای ساخت‌های محلی و ساخت‌های تستی push/PR است که منتشر نمی‌شوند (`versionCode = 1`).
- CI بعد از ساخت با `apksigner verify --print-certs` اثر انگشت SHA-256 گواهی را با مقدار مورد انتظار و با `assetlinks.json` زنده مقایسه می‌کند.

## App Links

`https://soundclouddl-player.netlify.app/.well-known/assetlinks.json` روی سایت Netlify با نام `soundclouddl-player` میزبانی می‌شود. این سایت جدا از این مخزن است و همراه صفحه‌های اشتراک‌گذاری `/t/<id>` و `/p/<code>` منتشر می‌شود. محتوای فعلی:

```json
[{"relation":["delegate_permission/common.handle_all_urls"],
  "target":{"namespace":"android_app","package_name":"com.soundclouddl.player",
  "sha256_cert_fingerprints":["7E:2D:8D:75:31:B0:9C:69:87:F7:0E:C7:F5:61:12:98:87:E5:3D:5A:CD:8D:85:25:B0:5B:8E:68:27:68:A7:5C"]}}]
```

اگر کلید امضا عوض شود، باید هم این فایل و هم `APP_CERT_SHA256` در `build.yml` به‌روز شوند. تست روی امولاتور در `.github/workflows/android-e2e.yml` است.

## گزارش مشکل امنیتی

لطفاً مشکل امنیتی را به‌صورت عمومی در Issues ننویسید؛ در ربات [@SoundClouddl_RoBot](https://t.me/SoundClouddl_RoBot) به مدیر پیام بدهید.

---

### English summary

- **App token:** 32 random bytes; only its SHA-256 is stored server-side (`app_sessions`). **No expiry**; it stays valid until logout. Logout deletes the session row, every later request gets `401` and the app signs out. Login codes expire after 10 minutes and are single-use. There is no "log out everywhere" yet; an admin can delete a user's rows in `app_sessions`. The token stays in WebView/Electron `localStorage` (`sc_token`). If it is ever moved to Keystore/safeStorage, the old value must be cleared on first run.
- **Android backup:** `allowBackup="false"`, plus `fullBackupContent` / `dataExtractionRules` that exclude every domain, so no WebView data (token, offline cache) goes to cloud backup or device transfer.
- **Updates:** the version must be strictly newer and the URL is derived from it, with fixed asset names. The SHA-256 must match the release's `SHA256SUMS`. On Android the package, version, versionCode and signer are also checked. The installer only starts after an explicit "Install" tap, and the hash is re-checked first.
- **Signing:** tag / manual releases fail without `ANDROID_KEYSTORE_B64`. The debug key is used only for local or unpublished test builds. CI checks the APK certificate against the expected fingerprint and the live `assetlinks.json`.
- **App Links:** `assetlinks.json` is hosted on the Netlify site `soundclouddl-player`, outside this repo.
- **Version codes:** `versionCode = MAJOR*10000 + MINOR*100 + PATCH`, so MINOR and PATCH must be ≤ 99. CI enforces this and also requires each release's code to be greater than the previous release's.
