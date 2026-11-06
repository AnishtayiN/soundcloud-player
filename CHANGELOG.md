# Changelog

## v1.5.1 — تکمیل کارهای نیمه‌تمام v1.5.0: ابزارک، اندروید اتو، تشخیص گفتار بومی، کارهای پس‌زمینه، اشتراک پشتیبان، فضای دقیق، صفحه‌ی دعوت

This release completes the parts of v1.5.0 that were missing or only worked while the app was open. The design (dark/orange), the name, the package (`com.soundclouddl.player`) and the architecture stay the same: shared `web/app.js`, Android WebView, Windows Electron 22, the existing Supabase function `scbot`, and the bot @SoundClouddl_RoBot.
- Persian-first is unchanged: default `fa`, `dir="rtl"`, `android:supportsRtl="true"`. New strings were added in fa and en (`STR`, `values/strings.xml`, `values-fa/strings.xml`); no existing Persian string was changed or removed.
- Nothing from P0/P1, v1.4.0 or v1.5.0 was reverted, and no feature was removed.
- There are no new client keys or secrets. Background jobs use only the user's existing app token (`x-app-token`) and the existing function.
- No fake data: the widget, notifications, progress, free space and voice text all come from the real player, WorkManager, StatFs or SpeechRecognizer.

**What was incomplete in v1.5.0 and is complete now**

| # | Part | v1.5.0 | v1.5.1 |
|---|---|---|---|
| 1 | Android home widget | did not exist | real widget on the existing `PlaybackService` / MediaSession |
| 2 | Android Auto | did not exist | MediaBrowserService on the same session |
| 3 | Voice search on Android | Web Speech only; the WebView usually has no recognizer, so the app showed "not available" | native `SpeechRecognizer` (fa-IR) through the bridge |
| 4 | New-release alerts | only while the app was open | Android: WorkManager every ~6 h, even with the app closed |
| 5 | Scheduled downloads | only while the app was open | Android: WorkManager with the window, weekdays, Wi-Fi and charging, persisted across reboots |
| 6 | Backup on Android | download only, no share sheet | `ACTION_SEND` + FileProvider share sheet |
| 7 | Free space | browser estimate (`navigator.storage.estimate`) shown as if exact | Android StatFs / Windows DriveInfo, exact; the estimate is labeled «تقریبی» |
| 8 | Invite link `/j/<code>` | the link existed but the page didn't (404) | invite page implemented (Netlify function) + public session-info API |

### 1. Android home widget — ابزارک صفحه‌ی اصلی
- Standard size (4×1 cells, resizable horizontally and vertically). Shows the cover, title, artist and state, plus ⏮ ⏯ ⏭. Tapping the cover or title opens the full player.
- Updated only by the existing `PlaybackService` (no second player engine). It updates on track change, play, pause and loading; the buttons send the same commands as the media notification.
- When the service is stopped, the widget shows the last saved track with a ▶ button and «پخش متوقف شده · برای باز کردن برنامه لمس کن»; it never shows "playing". A tap opens the app.
- The last state is kept in the app's private `now_playing` preferences, so after a reboot or after the app is closed the widget shows the last real track.
- Persian RTL layout (`widget_player.xml`) with an LTR copy for English (`widget_player_ltr.xml`); the language comes from the app. Dark/orange.
- In Settings, the widget item uses `requestPinAppWidget` when the launcher supports it, otherwise it shows how to add the widget from the launcher.
- Fixed with this work: a pause from the widget, notification, Android Auto or headset while a song is still loading used to be overridden by the autoplay when loading finished. It now stays paused.

**Files:** `PlayerWidget.java`, `NowPlaying.java`, `PlaybackService.java`, `MainActivity.java`, `res/layout/widget_player.xml`, `res/layout/widget_player_ltr.xml`, `res/xml/player_widget_info.xml`, `res/drawable/widget_*.xml`, `AndroidManifest.xml`, `values{,-fa}/strings.xml`, `web/app.js`

### 2. Android Auto — اندروید اتو
- `PlaybackService` is now also a `MediaBrowserServiceCompat` on the same MediaSession. Root categories: «علاقه‌مندی‌ها», «پلی‌لیست‌ها», «آفلاین», «اخیراً پخش‌شده».
- The library is a token-free device snapshot (`files/auto_lib.json`) that the web app writes when favorites, playlists, downloads, recent plays, the language or the sign-in change. Signing out empties it.
- Only Android Auto, the system and this app can list the library (`trusted()` checks the package / uid); any other client gets an empty root.
- Supported: play from a list, play/pause, next/previous, and choosing from the queue (`setQueue` + `skipToQueueItem`). There is no text input and no video (Auto rules).
- Playback needs the app's web player. If the app isn't running, Auto shows «اول برنامه را روی گوشی باز کن، بعد از اینجا پخش کن». Android doesn't allow starting an activity from the background, so this cannot be done silently.
- Windows keeps media keys and SMTC as before.

**Files:** `AutoLib.java`, `PlaybackService.java`, `res/xml/automotive_app_desc.xml`, `res/drawable/ic_auto_*.xml`, `AndroidManifest.xml`, `values{,-fa}/strings.xml`, `web/app.js`

### 3. Native speech bridge for voice search — تشخیص گفتار بومی
- On Android, voice search uses `SpeechRecognizer` with `fa-IR` (`en-US` when the app is in English) via `SCAndroid.speechStart/speechStop`.
- Only our own page may start it (`ownPage`, the v1.3.1 origin check); events are posted only to the app origin.
- Partial and final results are shown, and the text stays editable before searching. Microphone permission uses the existing runtime-permission flow.
- Closing the sheet, navigating, leaving the page, hiding the app (`onStop`) or a new run always cancels recognition. Late results are dropped by a run counter.
- No recognizer, denied permission, no speech, network or language errors each show a clear Persian message and never insert text.
- The Mini App and Windows are unchanged: Web Speech where available, otherwise the honest "not available" message.

**Files:** `MainActivity.java`, `web/app.js`, `web/index.html`

### 4. Background new-release check + system notification — بررسی آهنگ تازه در پس‌زمینه
- **Android:** periodic WorkManager job `release-check` (6 h with a 1 h flex window, network required) that runs while the app is closed. It calls the existing `/releases` endpoint with the user's own app token.
- Notifications use the existing channel. A tap opens the song (one new song) or the artist (several).
- The v1.5.0 rules are kept:
  - only songs published after following;
  - each track alerts once;
  - at most one summary per artist per day;
  - per-artist mute and a global switch;
  - unfollowing stops all checks.
- What the background job saw is merged back into the app (`bgSeen`), so the app never repeats an alert.
- Settings say honestly that battery optimization can delay checks and that no exact time is guaranteed. The new «اجرا در پس‌زمینه و باتری» card shows the real optimization state, opens the system setting, and has notes for Xiaomi/Redmi/POCO ("Autostart", "No restrictions") and other strict OEMs.
- Manual trigger for testing: «آزمایش بررسی پس‌زمینه» on the followed-artists page runs the real WorkManager job once (`SCAndroid.bgCheckNow`, same rules, same notification; the app can be closed right after). Debug builds also accept the adb broadcast `rel_now`. «بررسی الان» still runs the in-app check.
- **Windows:** no background job once the app is closed. Electron 22 has no OS-scheduled task in the existing desktop pattern, and adding a Windows service or Task Scheduler entry would change the architecture. While the app runs (also minimized) it checks every 6 h and shows real Windows notifications (`Notification`); otherwise it checks on the next launch. The app says so: «در ویندوز وقتی اپ باز است هر ۶ ساعت بررسی می‌شود؛ وگرنه در اجرای بعدی.»

**Files:** `ReleaseWorker.java`, `Bg.java`, `MainActivity.java`, `AndroidManifest.xml`, `android/app/build.gradle` (`androidx.work:work-runtime:2.9.1`), `desktop/main.js`, `desktop/preload.js`, `web/app.js`

### 5. Background scheduled downloads — دانلود زمان‌بندی‌شده در پس‌زمینه
- **Android:** a WorkManager job `sched-dl` with constraints: Wi-Fi only → `UNMETERED`, charging → `requiresCharging`. It starts inside the chosen window and weekdays.
- WorkManager persists the queue and window across reboots, and the job is rescheduled for the next window.
- Before each song, the real size is checked against `limitMB` and the free space.
- A progress notification shows «در حال دانلود N از M» with real bytes and a «لغو» button.
- Downloads go to `bgdl/<id>.part` and are renamed only when complete. Leaving the window, losing Wi-Fi, a cancel or a system stop deletes the partial file; the song stays queued and starts again in the next window.
- Finished songs are imported into the offline library on the next app start, from the device and without internet (`schedTake` / `schedAck`).
- Settings note: «…بهینه‌سازی باتری ممکن است شروع را عقب بیندازد؛ زمان دقیق تضمین نمی‌شود.» The battery card from part 4 applies here too.
- **Windows:** no background download when the app is closed (same reason as part 4). Downloads run while the app is open and continue on the next launch. The UI says so (`schNoteW`); nothing is faked.

**Files:** `SchedWorker.java`, `SchedCancelReceiver.java`, `Bg.java`, `MainActivity.java` (`/bgdl/` handler), `AndroidManifest.xml`, `values{,-fa}/strings.xml`, `web/app.js`

### 6. Android backup share — اشتراک‌گذاری پشتیبان
- «اشتراک‌گذاری پشتیبان» opens the system share sheet (`ACTION_SEND` + `FileProvider`, `content://` only, temporary read-only grant, no `file://`).
- Before sharing, both the web app (`bkHasSecret`) and the native side check that the file contains no token or secret (`sc_token`, `x-app-token`, `x-init-data`, initData hash…). If one is found, nothing is shared and a Persian message is shown. The Windows "Save as…" dialog does the same check.
- **Older backups:** v1.5.0 backups never contained tokens. The export used the `BK_KEYS` whitelist, and import accepts only `BK_KEYS`, so there was nothing to remove.
- The shared file imports on a clean profile: merge without duplicates, or replace after a confirmation (the existing v1.5.0 import).

**Files:** `MainActivity.java`, `res/xml/file_paths.xml`, `desktop/main.js`, `desktop/preload.js`, `web/app.js`

### 7. Exact free space — فضای آزاد دقیق
- Android: `StatFs` on the volume that holds the app data (IndexedDB offline songs) via `SCAndroid.storageInfo()`. Windows: free and total space of the drive holding `userData` via .NET `DriveInfo` (works on Windows 7).
- The offline size is the sum of the real blob bytes in IndexedDB, so it matches the free-space figure.
- Fallback (Mini App / browser): the old `navigator.storage.estimate()` figure, now explicitly labeled «تقریبی» with an explanation.

**Files:** `MainActivity.java`, `desktop/main.js`, `desktop/preload.js`, `web/app.js`, `web/app.css`

### 8. Listen-together invite page — صفحه‌ی دعوت
- `https://soundclouddl-player.netlify.app/j/<code>` is served by the Netlify function `open` (`/j/*` in `_redirects`). It reads the new public endpoint `GET /api/public/party/<code>`, which returns only the bot name, the track title / artist / cover and the state (200 active, 410 expired/ended, 404 unknown). It exposes no user ids.
- Active session: track info with «باز کردن در برنامه» (`scplayer://j/<code>`), «باز کردن در تلگرام» (`t.me/SoundClouddl_RoBot?start=j_<code>`) and «دانلود برنامه». If the app doesn't open, the page shows a hint and highlights the download button.
- Expired, ended and invalid codes each show a clear Persian message. Typing the code in the app still works.
- Android (`/j/` App Link + `scplayer://j/`) and Windows (`scplayer://` protocol) open the session directly when the app is installed.

**Files:** backend `supabase/functions/scbot/src/api.ts` (public party route, live since loader v17); site `site-src/open.js`, `site/_redirects`, `site/open.html`; app `AndroidManifest.xml`, `MainActivity.java`, `desktop/main.js`, `web/app.js`

### Tests
- `tests/v151.spec.mjs`: 12 Playwright tests for the web side of every part. Full web suite: 97/97 (85 + 12).
- `tests/native/android-native.mjs` + `.github/workflows/android-native.yml`: Android 13 emulator (API 33) running the real debug APK against a local mock API. Covers:
  - the widget on the launcher (controls, track change, app closed);
  - Android Auto browse and control through `MediaBrowserCompat`;
  - native speech (recognition, no recognizer, no speech, stop, late result, permission denied);
  - background release checks with notifications while the app is closed (mute, unfollow);
  - scheduled downloads (window, Wi-Fi, charging, cancel from the notification, leaving the window, resume, reboot);
  - the backup share sheet + file read through the grant + clean-profile import + no token;
  - StatFs vs `df`;
  - invite links.
- `tests/native/cdp-check.mjs` (Windows CI): `storageInfo` equals .NET `DriveInfo` on the runner; `saveFile` refuses a token; `notify` works.
- Debug-only helpers live in `android/app/src/debug/` (`DebugReceiver`, `DebugRecognitionService`, `DebugMockApi`, `ShareCheckActivity`). They are not in the release APK, and the mock-API hook is inert in release builds.

## v1.5.0 — گوش دادن هم‌زمان، جستجوی صوتی و آفلاین، حافظه، پشتیبان، زمان‌بندی دانلود، آهنگ‌های تازه، تشخیص از ویدیو

Nothing here changes the UI design (dark/orange), the app name, the package (`com.soundclouddl.player`) or the architecture: shared `web/app.js`, Android WebView, Windows Electron 22, the existing Supabase function `scbot`, bot @SoundClouddl_RoBot.
- The UI stays Persian-first (`fa`, `dir="rtl"`). `STR.fa` was only extended (465 = 465 keys in fa and en).
- The v1.3.1 P0/P1 fixes and every v1.4.0 feature are untouched. No existing feature was removed.
- No new keys or secrets in the clients: everything uses `x-init-data` / `x-app-token` and the existing function.
- No fake data: every state below comes from the real backend, IndexedDB or the device, and is asserted by `tests/v15.spec.mjs` (27 tests + 7 Persian screenshot checks). Full suite: 85/85.

**Backend** (Supabase Edge Function `scbot`, deployed separately; live since this release, loader v16):
- Migration `20261031000000_party.sql`: tables `party_sessions` / `party_members` (RLS on), RPC `party_op`.
- `src/api.ts`: `/party/*`, `/releases?ids=`, `/backup/send`, `POST /playlists/:id/tracks` accepts `track_ids[]`, `/recognize` accepts `{sigs:[…]}` and `{clips:[…]}`.
- `src/bot.ts`, `src/i18n.ts`: video / video note / MP4 document recognition, `j_` invite start parameter, `reply_parameters`.
- New `src/mp4parse.ts`, `src/mp4audio.ts`, `src/sigweb.ts`; `src/shazam.ts` (`recognizeVideo`, `recognizeClips`); `src/soundcloud.ts` (`getUserReleases`).

### 1. Listen together — گوش دادن هم‌زمان
- «شروع نشست هم‌زمان» in the player creates a 10-character code and an invite link (shared with the existing share). There are no accounts and no public list.
- State (track, position, playing, updated_at) lives in the backend; only participants can read it, only the host can change it.
- Guests poll every 2.5 s and re-sync when more than 3 s off. A late joiner starts at the host's position. The host's play/pause/seek/song change are followed; a guest can't change the song.
- **No realtime channel:** synchronization is polling (host pushes changes, guests poll). Accuracy is about ±3 s, by design.
- Leave, end by the host, and expiry after 30 minutes without host activity. Offline: «برای نشست هم‌زمان باید آنلاین باشی».
- Invite links: Mini App → `t.me/<bot>?start=j_<code>`; Android / Windows → `https://soundclouddl-player.netlify.app/j/<code>` (also `scplayer://j/<code>`). Joining by typing the code works everywhere.

**Files:** `web/app.js`, `web/app.css`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/com/soundclouddl/player/MainActivity.java`, `desktop/main.js`, `tests/v15.spec.mjs`

### 2. Voice search + offline search — جستجوی صوتی و جستجوی آفلاین
- A microphone button in search uses the platform's speech recognizer (`fa-IR`). The recognized text is editable before searching.
- Closing the sheet, navigating, hiding the app or typing always stops the microphone; results that arrive after a stop are ignored.
- When no recognizer is available, the app says so in Persian and fills in nothing.
- Without internet, search runs over the downloads on this device (title, artist, playlist name; Arabic ي/ك match Persian ی/ک) with an «آفلاین» badge. Online, matching downloads are listed first.
- Recent searches are stored only on the device and can be cleared.

**Files:** `web/app.js`, `web/app.css`, `tests/v15.spec.mjs`

### 3. Smart storage — حافظه
- «حافظه» page: total, free space, offline limit, per artist / per playlist / per song (largest first). The total equals the bytes actually stored in IndexedDB.
- Clean-up suggestions (never played, or not played for 90 days). Nothing is deleted without a selection and a confirmation; saved lyrics are deleted with the song.
- Auto-cleanup is OFF by default; the user picks the rule and sees the exact list first. Favorites are never removed without asking.
- Travel mode downloads all favorites in the lowest real quality the backend offers, shows the approximate size first, and respects the limit and Wi-Fi.

**Files:** `web/app.js`, `web/app.css`, `tests/v15.spec.mjs`

### 4. Backup / transfer — پشتیبان و انتقال
- Versioned JSON (`soundcloud-player-backup`, v1): playlists, favorites, followed artists, settings, offline song list. No audio, and the UI says so.
- Import via the file picker, then merge (no duplicates) or replace (asks first). A damaged file, other format or newer version shows a Persian message and changes nothing.
- Transfer: «ارسال فایل به چت ربات» sends the file to the bot chat (only when tapped; nothing is stored on the server). On Android, the system share (e.g. to Saved Messages) appears once the native share bridge is present.

**Files:** `web/app.js`, `web/app.css`, `tests/v15.spec.mjs`

### 6. Download scheduling — زمان‌بندی دانلود
- Time window + weekdays (windows across midnight supported). Scheduled downloads start only inside the window, a download in progress is paused when the window ends (nothing partial is kept) and restarts in the next window.
- Optional Wi-Fi only / charging only. The downloads page shows the next run, the scheduled queue, «الان دانلود کن» and per-song cancel. The queue survives a restart.
- Honest limits are shown in the app: in this version the scheduler runs while the app is open (Android may close a background app to save battery; Windows runs it while open, otherwise at the next launch).

**Files:** `web/app.js`, `web/app.css`, `tests/v15.spec.mjs`

### 7. New-release alerts — آهنگ‌های تازه
- Follow / unfollow on the artist page and in artist search results; the list is in Settings → «خواننده‌های دنبال‌شده».
- Checked through the existing API (`/releases`). Only songs whose real SoundCloud date is after the follow are reported, each once, at most one alert per artist per day.
- Per-artist mute and a global switch; unfollow stops checks for that artist.
- In this version the check runs while the app is open (every 6 hours) and alerts in the app.

**Files:** `web/app.js`, `web/app.css`, `tests/v15.spec.mjs`

### 8. Song recognition from video — تشخیص آهنگ از ویدیو
- The bot accepts video, video notes and MP4/MOV documents (GIFs are ignored). It extracts the audio itself (no third party, no new keys) and uses the same Shazam path as voice notes.
- Up to the first 120 s are tried; if nothing matches and the video is longer, one window from the middle. Files over 20 MB are refused by Telegram's bot API and the bot says so.
- No audio / silent / too short / damaged → «این ویدیو صدا ندارد» or «این فایل قابل تشخیص نیست». Not found → «این آهنگ پیدا نشد» + search by name. Nothing is kept after the request.
- The app's recognition file picker accepts videos too and sends one request with up to 4 windows. If the WebView can't decode AAC, only the cut 12-second windows are sent and decoded on the server.

**Files:** `web/app.js`, `web/shazamsig.js`, `tests/v15.spec.mjs`, `tests/media/*` (synthetic tones only)

### Not in v1.5.0 (planned for v1.5.x)
- **5. Android home-screen widget and Android Auto:** not included yet. Windows keeps media keys as before.
- **Native Android pieces:** the speech-recognizer bridge (until then the voice button shows «جستجوی صوتی روی این دستگاه در دسترس نیست»), background release checks with system notifications, background scheduled downloads, file sharing for backups, and exact free space.
- The invite page `https://soundclouddl-player.netlify.app/j/<code>` goes live with the next website deploy; it doesn't need an app update.

### Fixes
- Unfollowing an artist could show the next artist's name in the toast.

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
- Drag-to-reorder drops the song where the finger is lifted, even when the release comes before the next animation frame. Grabbing a song near the sheet's edge no longer auto-scrolls the list away from the finger: edge scrolling only starts when you drag toward that edge. Before, the song could land a row short.

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
  - Windows (packaged EXE, Windows Server 2022 runner): speed 1.49× / 0.77× / 1.97×, EQ bass +6.1 dB / treble +8.8 dB, timer faded and stopped at 18.1 s;
  - Android 13 WebView: speed 1.47× / 0.80× / 1.92×, EQ bass +5.4 dB / treble +7.2 dB, timer stopped at 18.3 s.
- `tests/telegram.spec.mjs` (new): the Mini App inside Telegram (no native bridge) — `initData` auth only, queue, real 1.5× speed, timer/EQ tools, and the honest «این دستگاه نوع اتصال رو گزارش نمی‌ده» note with favorites auto-download off.
- `tests/screens.spec.mjs`: Persian/RTL screenshots of the queue, lyrics, «آمار من», downloads + quality sheet, resume banner, player tools, sleep timer, EQ and recognition result (CI artifact `screenshots`, copies in `docs/screenshots/v1.4/`).

### Fix: sheets closed right after opening
- A sheet (recognizer, queue, menus) that was closed before its opening animation frame (fast back, navigation or app hide right after a tap) reappeared a moment later. Now a close always wins.

**Files:** `web/app.js`, `tests/features.spec.mjs`

### Windows: sandbox fallback on new Windows builds
- On the newest Windows builds (seen on Windows Server 2025 / build 26100, the Windows 11 24H2 kernel, with the October 2026 updates), Electron 22's sandboxed GPU and renderer processes crash at startup (0xC0000005) and the window stays blank. Electron 22 can't be upgraded: it's the last version that runs on Windows 7.
- If the GPU or the page crashes repeatedly right after launch, the app now restarts itself once with Chromium's `--no-sandbox` and remembers this for 7 days, then tries the sandbox again. The page is only the bundled UI (contextIsolation on, nodeIntegration off). Where the sandbox works, nothing changes: CI fails if the fallback ever triggers on Windows Server 2022.
- CI: the release EXE is built and engine-checked on `windows-2022`. A non-blocking `windows-latest-probe` job boots the app on the newest image and checks that it recovers on its own.

**Files:** `desktop/main.js`, `.github/workflows/build.yml`

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
