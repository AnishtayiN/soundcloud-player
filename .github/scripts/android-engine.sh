#!/usr/bin/env bash
# Player engine checks inside the real Android WebView (debuggable build): speed, EQ, sleep timer.
set -uo pipefail
PKG=com.soundclouddl.player
OUT=e2e-engine
mkdir -p "$OUT"
adb wait-for-device
adb shell getprop ro.build.version.release
adb install -r -g SoundCloud-Player-debug.apk || { echo "::error::install failed"; exit 1; }
adb logcat -c
adb shell am start -n "$PKG/.MainActivity"
sock=""
for i in $(seq 1 40); do
  sock=$(adb shell cat /proc/net/unix | tr -d '\r' | grep -o 'webview_devtools_remote_[0-9]*' | head -1)
  [ -n "$sock" ] && break
  sleep 2
done
[ -z "$sock" ] && { echo "::error::no WebView DevTools socket (is the APK debuggable?)"; adb logcat -d > "$OUT/logcat.txt"; exit 1; }
echo "devtools socket: $sock"
adb forward tcp:9222 "localabstract:$sock"
sleep 4
node tests/native/cdp-check.mjs --port 9222 --out "$OUT/engine.json" --shot "$OUT/engine.png"
code=$?
adb exec-out screencap -p > "$OUT/screen.png" || true
adb logcat -d > "$OUT/logcat.txt"
if adb logcat -d | grep -E "FATAL EXCEPTION" -A3 | grep -q "$PKG"; then echo "::error::FATAL EXCEPTION in $PKG"; code=1; fi
exit $code
