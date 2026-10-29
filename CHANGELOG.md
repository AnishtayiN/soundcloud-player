# Changelog

## v1.3.1 — امنیت و پایداری · hardening

The UI design, app name, package (`com.soundclouddl.player`) and architecture (shared `web/app.js`, Android WebView, Windows Electron 22) are unchanged. The UI is still Persian-first (`fa`, `dir="rtl"`) and `STR.fa` was not touched; only new strings were added, in both fa and en.

### P0
| # | Fix | Files |
|---|---|---|
| 1 | **Smoke tests + CI gate.** Headless Chromium (Playwright) loads `web/app.js` exactly as the Android asset loader serves it. The tests check that home renders, that search drops stale responses via `searchSeq`, and that `applyLang("fa")` → `dir="rtl"` / `en` → `ltr`. The new `test` job runs before the APK/EXE builds, which depend on it. Test-only hook: `window.__scTest`, exposed only when `__SC_TEST__` is set. | `tests/*` (new), `.github/workflows/build.yml`, `web/app.js` |
| 2 | **Verified updates.** The version must be `x.y.z` and strictly newer than the installed one. The download URL is derived from the version, with fixed names `SoundCloud-Player.apk` / `SoundCloud-Player-Setup.exe`. The SHA-256 must match the release's `SHA256SUMS`. Android also checks package, versionName, a higher versionCode and the signing cert inside the APK. Nothing is installed automatically: the user must tap «نصب», and the hash is re-checked right before installing. The installer is no longer started from `run()`/`onResume()`, and Windows no longer runs the installer when the download finishes. The UI gains «در حال بررسی…» and «فایل آپدیت تایید نشد» states. | `android/.../Updater.java`, `android/.../MainActivity.java`, `desktop/main.js`, `desktop/preload.js`, `web/app.js`, `.github/workflows/build.yml` (publishes `SHA256SUMS`) |
| 3 | **Release signing.** Tag / workflow_dispatch builds fail if `ANDROID_KEYSTORE_B64` is missing. Gradle refuses `RELEASE_BUILD=true` without a keystore. The debug key is only used for local and unpublished test builds (push/PR, `versionCode 1`). CI verifies the APK certificate with `apksigner` against the expected fingerprint and the live `assetlinks.json`. | `.github/workflows/build.yml`, `android/app/build.gradle` |
| 4 | **App Links.** `assetlinks.json` is live (HTTP 200) with the release fingerprint, and Google's Digital Asset Links API reports `linked: true`. The hosting location is documented. The emulator test checks that the `/t/<id>` link is verified and opens the app. | `SECURITY.md`, `.github/workflows/android-e2e.yml`, `.github/scripts/android-e2e.sh` (new) |

### P1
| # | Fix | Files |
|---|---|---|
| 5 | **Backup.** `allowBackup="false"`, plus `fullBackupContent` and `dataExtractionRules` excluding all domains (WebView storage incl. `sc_token`). The token's storage location is unchanged, so no migration is needed. Token lifetime and revoke behavior are documented. | `AndroidManifest.xml`, `res/xml/backup_rules.xml`, `res/xml/data_extraction_rules.xml` (new), `SECURITY.md` |
| 6 | **Native messages.** Android `postToWeb` posts to the asset-loader origin `https://appassets.androidplatform.net` (not `*`), and only while that origin is loaded. The web handles `__sc` messages only if `e.source === window` and the origin matches. Electron no longer uses `postMessage(msg,"*")`: preload delivers events to `SCNative.onEvent()`, accepting only messages from the main process with a sanitized shape. All IPC in main checks that the sender is our window's main frame on the bundled page. | `MainActivity.java`, `web/app.js`, `desktop/preload.js`, `desktop/main.js` |
| 7 | **Playback restore.** The queue, index, position, playing state and repeat/shuffle are saved in `localStorage` (`sc_player`). After a renderer crash, Android (`onRenderProcessGone`) and Windows (`render-process-gone`) reload with `#recover=1`, and the same track resumes from the same position. | `web/app.js`, `MainActivity.java`, `desktop/main.js` |
| 8 | **PlaybackService.** The wake/Wi-Fi lock is limited to the remaining track time + 2 min (15 min if unknown, 3 h max), and the timeout releases both. Locks are released if a state update throws. Artwork loads on a single background thread: bounds-first `inSampleSize` decode, 4 MB cap, stale loads cancelled. | `PlaybackService.java` |
| 9 | **Offline storage.** Audio + meta are written in one IndexedDB transaction. Downloads can be cancelled (per track / all, with confirmation) and have timeouts (30 s per HLS segment, 180 s per file). Size is checked against `limitMB` before downloading. HLS segments in memory are capped at 80 MB and released on track change. | `web/app.js` |
| 10 | **Search paging.** A loading guard for `more=true`, one stored `IntersectionObserver` (disconnected before reuse), de-duplication by track id, and stale pages dropped. A test proves that two rapid "load more" calls produce no duplicates. | `web/app.js`, `tests/regression.spec.mjs` |
| 11 | **Mic.** Closing the recognition sheet, navigating to another screen/tab, opening another sheet, the page becoming hidden (`visibilitychange`/`pagehide`), or a `getUserMedia` promise resolving after cancel now always stops every track and closes the `AudioContext`. Covered by 6 regression tests. | `web/app.js`, `tests/regression.spec.mjs` |
| 12 | **Small fixes.** Null/HTTPS check on `request.getOrigin()` in `onPermissionRequest`. Ctrl+Shift+I and F5 only in development (`npm start`, `SC_DEVTOOLS=1` or `--devtools`). Windows sends a generic label (e.g. `Windows 10`) instead of `os.hostname()`. Version code limit: `versionCode = MA*10000+MI*100+PA`, so MINOR/PATCH ≤ 99 (enforced in CI, along with "greater than the previous release"). | `MainActivity.java`, `desktop/main.js`, `.github/workflows/build.yml`, `SECURITY.md` |

### Tests
- `tests/smoke.spec.mjs`: home, searchSeq, applyLang fa/en.
- `tests/regression.spec.mjs`: paging, mic (6 paths), renderer crash restore, restart restore, foreign-origin message ignored, verified update flow.
- `tests/screens.spec.mjs`: Persian/RTL screenshots of login, home, search, library, offline, settings and player (CI artifact `screenshots`).
- `android-e2e.yml`: App Link + WebView renderer kill on an Android 13 emulator.

## v1.3.0
Lyrics search and song recognition (Shazam) in the bot, Mini App and apps.

## v1.2.0
Offline cache: songs that have been played once replay without internet.

## v1.1.0
In-app updates and app share links.
