# Changelog

## v1.4.0 — صف پخش، ادامه روی دستگاه دیگر، آفلاین هوشمند، متن آهنگ، آمار من، تشخیص یک‌لمسی، تایمر/سرعت/اکولایزر

Nothing here changes the UI design (dark/orange), the app name, the package (`com.soundclouddl.player`) or the architecture: shared `web/app.js`, Android WebView, Windows Electron 22, the existing Supabase function `scbot`, and the bot @SoundClouddl_RoBot.
- The UI stays Persian-first (`fa`, `dir="rtl"`). `STR.fa` was only extended: every new string exists in fa and en.
- The v1.3.1 P0/P1 fixes are untouched. No existing feature was removed.
- No new keys or secrets in the clients. Everything uses the existing auth (`x-init-data` / `x-app-token`) and the existing function.
- No fake data: every number, lyric, recognition result, download status and EQ effect below is real and is measured by the tests.

**Backend** (Supabase Edge Function `scbot`, deployed separately from this repo; live since this release):
- `src/api.ts`: new `GET /stream/:id/options`, `GET /stream/:id?preset=`, `GET|POST /resume`, `GET /lyrics/:id`; `/recognize` now returns `matched`.
- `src/soundcloud.ts`: `streamOptions`, `getStreamPreset`.
- `src/lrclib.ts` (new); `src/lyrics.ts`.
- Migration `20261030000000_playback_state.sql`: table `playback_state`, RLS on, plus RPC `put_playback_state` (newest `updated_at` wins atomically).

### 1. Queue — صف پخش
- The player's queue button opens the queue with the current song marked «در حال پخش».
- Per song: play, remove, drag to reorder (handle ☰), «پخش بعدی», «افزودن به انتهای صف». «پاک کردن صف» keeps only the current song.
- Shuffle keeps the original order (`orig`). Turning it off restores that order around the current song without restarting it.
- Repeat cycles off → all → one.
- The queue, original order, index, position, shuffle and repeat are persisted (`sc_player` v2). They survive closing the app and `onRenderProcessGone` / `render-process-gone`.
- An unavailable song (404, DRM, broken file) is skipped with a Persian toast, never retried in a loop, even with repeat-one. If every song fails, playback stops with a message.
- An expired direct CDN link is refreshed once and resumes at the same position.

**Files:** `web/app.js`, `web/app.css`, `tests/features.spec.mjs`, `tests/harness.mjs`

### 2. Cross-device resume — ادامه روی دستگاه دیگر
- `{track_id, position_ms, duration_ms, ended, device_id, updated_at}` is stored in the existing backend through the existing auth. There is no new account system, and only the signed-in user's own row is read or written.
- It is saved on pause, on track change, and at most every 15 s while playing.
- The banner «ادامه از دقیقه‌ی X» appears only if the state comes from another device, is newer than this device's state, has a valid position, and hasn't been dismissed. Tapping it resumes there.
- Above 95% of the song, or after it ended, the banner offers to start from the beginning.
- Newest `updated_at` wins in SQL. An older state (for example from a device that was offline) can never overwrite a newer one.
- Offline, the state is kept locally (`sc_resume`) and synced when the device is back online.

**Files:** `web/app.js`, `web/app.css`, backend (`api.ts`, migration), `tests/features.spec.mjs`

### 3. Smart offline — آفلاین هوشمند
**Batch downloads:**
- Download a whole playlist with per-song and overall progress, plus cancel one, cancel all and retry failed.
- Songs that are already offline are listed as «از قبل آفلاین بود» and skipped.
- A new «دانلودها» screen sits in Library and Settings.

**Room check:**
- Before anything starts, the estimated size is checked against `limitMB` and free space (`navigator.storage.estimate`).
- If there isn't room, nothing starts and a clear Persian message is shown.

**Quality:**
- Choices come only from the backend's real options for that song (`/stream/:id/options`: AAC ~162 / ~97 kbps), each with its approximate size.
- A default quality is set in Settings (`sc_off_q`).

**Auto-download favorites** (default **OFF**, `sc_off_favauto`): Wi-Fi only.
- Android uses `ConnectivityManager` (unmetered Wi-Fi/Ethernet; a metered hotspot counts as mobile data).
- Windows 8+ uses the WinRT connection-cost API.
- When the device can't tell (e.g. Windows 7, or a browser without `navigator.connection`), Settings says so and downloads happen only after the user confirms. Never automatically on mobile data.

**Status in track lists:** downloading %, queued, failed, offline.

**No partial files:** audio, meta and lyrics are written in one IndexedDB transaction (`sc_offline` v2), and cancelled or failed downloads leave nothing behind.

**Files:** `web/app.js`, `web/app.css`, `web/index.html`, `android/.../MainActivity.java` (`netInfo` + network callback), `desktop/main.js` (`net-info`), `desktop/preload.js`, backend (`soundcloud.ts`, `api.ts`), `tests/features.spec.mjs`

### 4. Lyrics in the player — متن آهنگ
- **Synced lyrics:** the current line is highlighted and autoscrolled, and tapping a line seeks to it. Otherwise plain text is shown.
- If nothing is found: «متن آهنگ پیدا نشد». Nothing is guessed or invented.
- **Source:** LRCLIB (free, open, no key), looked up by the existing backend with artist, title and duration, and cached server-side. No paid service and no client key.
- **Known limit:** LRCLIB coverage of Persian songs is partial, so many will honestly show «پیدا نشد». The source is shown under the lyrics.
- Lyrics are saved with offline songs, so they show without internet, and they are deleted together with the song.
- Text direction follows the lyric language per line (Persian `rtl`, English `ltr`).
- Fix: the lyrics panel scrolls inside the player, and the transport controls never leave the screen.

**Files:** `web/app.js`, `web/app.css`, backend (`lrclib.ts`, `lyrics.ts`, `api.ts`), `tests/features.spec.mjs`

### 5. My stats — آمار من
- **Ranges:** 7 days, 30 days, all time. **Shown:** top artists, top songs, listening minutes, number of plays and different songs.
- **One counted-play rule everywhere:** at least 30 s listened, or more than 50% of the song. Only time actually heard counts (seeking doesn't count).
- Built only from real local history (IndexedDB `sc_stats`) and never uploaded.
- The Persian summary card is shared only when the user taps «اشتراک‌گذاری», through the existing share.

**Files:** `web/app.js`, `web/app.css`, `tests/features.spec.mjs`

### 6. One-tap recognition — تشخیص یک‌لمسی
- The result sheet offers play, download (with the quality choice), add to queue, add to playlist and add to favorites.
- Only songs that really match the recognized title and artist are shown as "the song" (`matched` from the backend).
- If the song isn't on SoundCloud: «این آهنگ توی ساندکلاد پیدا نشد», plus a button to search the name. No fake result is shown.
- A local recognition history (`sc_rec_hist`) offers the same actions.
- The mic stream and `AudioContext` are always stopped on close, navigation, another sheet, or the page being hidden (as in v1.3.1, re-tested).

**Files:** `web/app.js`, `web/app.css`, `tests/features.spec.mjs`

### 7. Sleep timer, speed, EQ — تایمر خواب، سرعت، اکولایزر
**Sleep timer:**
- Options: 5, 10, 15, 30, 45, 60 min and «پایان آهنگ فعلی».
- The remaining time is shown on the player chip, and the timer can be cancelled.
- The volume fades over the last 15 s, then playback stops and the volume is restored.

**Speed:**
- 0.75× / 1× / 1.25× / 1.5× / 2×, applied to the real `playbackRate` and kept across songs.
- The Android notification and lock-screen progress use the same rate.

**EQ:**
- Presets «تخت», «بم», «وکال», «تریبل», plus 5 manual bands (60 Hz – 12 kHz, ±12 dB) with automatic headroom so boosting can't clip.
- It runs in WebAudio on the playing audio and is measured on the app's own `AnalyserNode` in the tests.
- The graph is created only on first use. SoundCloud's CDNs send `Access-Control-Allow-Origin: *`, so the stream is re-opened once with CORS at the same position.
- The EQ button is hidden where WebAudio can't process the stream (iOS Telegram), so there is no fake UI.

**Files:** `web/app.js`, `web/app.css`, `android/.../PlaybackService.java` (rate), `tests/features.spec.mjs`, `tests/native/*` (new), `.github/workflows/build.yml`, `.github/workflows/android-e2e.yml`, `.github/scripts/android-engine.sh` (new)

### Tests
- `tests/features.spec.mjs` (new, 26 tests):
  - queue: play from the middle, item actions, drag, shuffle → restore, repeat one/all, restore after restart, unavailable or expired songs;
  - resume: another device, conflict, offline change, near the end, no-banner cases;
  - smart offline: batch, cancel/retry with no partial files, no room, quality/size, favorites on Wi-Fi / mobile / unknown;
  - lyrics: synced/plain/none, direction, offline cache;
  - stats: counted-play rule, ranges, share;
  - recognition: recognize → download + playlist + history, not found, mic stop;
  - timer, speed and EQ.
- `tests/native/cdp-check.mjs` + `engine-check.mjs` (new) run inside the **real apps** over CDP, with no mocks of the player. Speed, EQ (spectrum) and the sleep timer are checked:
  - in the packaged Windows app on a Windows runner (`build.yml` → artifact `windows-engine-check`);
  - in the Android WebView on an Android 13 emulator (`android-e2e.yml` → job `engine`, debuggable build);
  - locally in Electron 22: speed 1.49× / 0.77× / 1.97×, EQ bass +6.3 dB / treble +8.7 dB, timer faded and stopped at 18.0 s.
- `tests/screens.spec.mjs`: Persian/RTL screenshots of the queue, lyrics, «آمار من», downloads + quality sheet, resume banner, player tools, sleep timer, EQ and recognition result (CI artifact `screenshots`, copies in `docs/screenshots/v1.4/`).

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
