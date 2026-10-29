#!/usr/bin/env bash
# Android emulator end-to-end checks for a released APK:
#   1. App Links: https://soundclouddl-player.netlify.app/t/<id> is verified and opens the app directly (no chooser / browser)
#   2. WebView renderer killed → onRenderProcessGone rebuilds the WebView, the app process survives, the UI comes back
#   3. Persian / RTL screenshots
set -uo pipefail
PKG=com.soundclouddl.player
HOST=soundclouddl-player.netlify.app
TRACK_ID="${TRACK_ID:-905805328}"
OUT="${OUT:-e2e-out}"
mkdir -p "$OUT"
fail=0
ok()  { echo "✅ $*"; }
bad() { echo "::error::$*"; fail=1; }
shot() { adb exec-out screencap -p > "$OUT/$1.png" || true; }
dump() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb exec-out cat /sdcard/ui.xml 2>/dev/null; }

adb wait-for-device
adb shell getprop ro.build.version.release
adb install -r -g SoundCloud-Player.apk || { echo "::error::install failed"; exit 1; }
adb shell dumpsys package "$PKG" | grep -m2 -E "versionName|versionCode"
adb logcat -c

# ── 1. App Links verification (Android 12+: pm get-app-links) ──────────────────────────────────────────────
adb shell pm verify-app-links --re-verify "$PKG" || true
state=""
for i in $(seq 1 30); do
  state=$(adb shell pm get-app-links "$PKG" | tr -d '\r')
  echo "$state" | grep -q "$HOST: verified" && break
  sleep 3
done
echo "$state" | tee "$OUT/app-links.txt"
if echo "$state" | grep -q "$HOST: verified"; then ok "App Links verified for $HOST"; else bad "App Links NOT verified for $HOST"; fi

# a https link must resolve straight to our activity
res=$(adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://$HOST/t/$TRACK_ID" | tr -d '\r')
echo "$res" | tee "$OUT/am-start.txt"
sleep 6
top=$(adb shell dumpsys activity activities | tr -d '\r' | grep -m1 -E "topResumedActivity|mResumedActivity")
echo "top: $top"
if echo "$top" | grep -q "$PKG/"; then ok "https://$HOST/t/$TRACK_ID opened the app"; else bad "the /t/ link did not open the app ($top)"; fi
shot 01-applink
dump > "$OUT/01-applink.xml"

# ── 2. kill the WebView renderer ──────────────────────────────────────────────────────────────────────────
APP_PID=$(adb shell pidof "$PKG" | tr -d '\r')
adb root >/dev/null 2>&1; sleep 3; adb wait-for-device
REN=$(adb shell ps -A -o PID,NAME | tr -d '\r' | grep -E "webview.*:sandboxed_process" | awk '{print $1}' | head -3)
echo "app pid=$APP_PID renderer pids=$REN"
if [ -z "$REN" ]; then
  bad "no WebView renderer process found"
else
  for p in $REN; do adb shell kill -9 "$p" || true; done
  sleep 8
  NEW_PID=$(adb shell pidof "$PKG" | tr -d '\r')
  echo "app pid after kill=$NEW_PID"
  if [ -n "$NEW_PID" ] && [ "$NEW_PID" = "$APP_PID" ]; then ok "app process survived the renderer kill"; else bad "app process died or restarted ($APP_PID → $NEW_PID)"; fi
  adb logcat -d | grep -E "onRenderProcessGone|chromium.*(crash|Renderer process)" | tail -5
  if adb logcat -d | grep -E "FATAL EXCEPTION" -A3 | grep -q "$PKG"; then bad "FATAL EXCEPTION in $PKG"; else ok "no crash in $PKG"; fi
  NEWREN=$(adb shell ps -A -o PID,NAME | tr -d '\r' | grep -E "webview.*:sandboxed_process" | awk '{print $1}' | head -3)
  echo "new renderer pids=$NEWREN"
  if [ -n "$NEWREN" ] && [ "$NEWREN" != "$REN" ]; then ok "WebView rebuilt with a new renderer"; else bad "no new renderer after the kill"; fi
  shot 02-after-renderer-kill
  ui=$(dump); echo "$ui" > "$OUT/02-after-renderer-kill.xml"
  # Persian UI is back (login screen without a token: «ورود با تلگرام»)
  if echo "$ui" | grep -q "تلگرام\|SoundCloud"; then ok "UI rendered again after the kill"; else bad "UI not visible after the kill"; fi
fi

adb logcat -d > "$OUT/logcat.txt"
exit $fail
