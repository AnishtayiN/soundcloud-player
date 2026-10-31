#!/usr/bin/env bash
# v1.5.1 native checks on the emulator: widget, Android Auto browse service, speech bridge, background release check,
# background scheduled downloads, backup share sheet, exact free space, invite links, reboot persistence.
# Debug APK only (its DebugReceiver / mock-API hooks don't exist in release builds). Logcat tag: SCDBG.
set -uo pipefail
PKG=com.soundclouddl.player
OUT=e2e-native
mkdir -p "$OUT"
adb wait-for-device
for i in $(seq 1 60); do [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1" ] && break; sleep 2; done
adb shell getprop ro.build.version.release
adb install -r -g SoundCloud-Player-debug.apk || { echo "::error::install failed"; exit 1; }
adb shell settings put global window_animation_scale 0
adb shell input keyevent KEYCODE_WAKEUP; adb shell wm dismiss-keyguard
node --experimental-websocket tests/native/android-native.mjs --out "$OUT"
code=$?
adb logcat -d > "$OUT/logcat.txt" 2>/dev/null || true
exit $code
