package com.soundclouddl.player;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Foreground "mediaPlayback" service: keeps the process alive while music plays in the WebView,
 * shows a media notification (lock screen / quick settings controls) and forwards button presses
 * back to the web player via window.__scMedia(cmd, arg).
 */
public class PlaybackService extends Service {

    private static final String CHANNEL = "playback";
    private static final int NOTIF_ID = 1001;
    private static final String A_TOGGLE = "sc.toggle", A_NEXT = "sc.next", A_PREV = "sc.prev", A_CLOSE = "sc.close";

    private static PlaybackService instance;
    private static JSONObject pending;

    private final Handler main = new Handler(Looper.getMainLooper());
    private MediaSessionCompat session;
    private JSONObject state = new JSONObject();
    private Bitmap art;
    private String artUrl = "";
    private PowerManager.WakeLock wake;
    private WifiManager.WifiLock wifi;
    private boolean foreground;

    // ---------- called from MainActivity (main thread) ----------

    static void onState(Context ctx, JSONObject s) {
        if (s.optBoolean("stop")) { stop(ctx); return; }
        if (instance != null) { instance.update(s); return; }
        if (!s.optBoolean("playing") && !s.optBoolean("loading")) return; // nothing to show yet
        pending = s;
        try {
            ContextCompat.startForegroundService(ctx, new Intent(ctx, PlaybackService.class));
        } catch (Exception ignored) { /* background start not allowed: will retry on next state */ }
    }

    static void stop(Context ctx) {
        pending = null;
        if (instance != null) instance.shutdown();
    }

    // ---------- lifecycle ----------

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }

        session = new MediaSessionCompat(this, "SoundCloudPlayer");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { cmd("play", null); }
            @Override public void onPause() { cmd("pause", null); }
            @Override public void onSkipToNext() { cmd("next", null); }
            @Override public void onSkipToPrevious() { cmd("prev", null); }
            @Override public void onSeekTo(long pos) { cmd("seek", String.valueOf(pos)); }
            @Override public void onStop() { cmd("stop", null); shutdown(); }
        });
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        session.setSessionActivity(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        session.setActive(true);

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SoundCloudPlayer:playback");
        wake.setReferenceCounted(false);
        WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
        if (wm != null) {
            wifi = wm.createWifiLock(Build.VERSION.SDK_INT >= 29 ? WifiManager.WIFI_MODE_FULL_HIGH_PERF : WifiManager.WIFI_MODE_FULL, "SoundCloudPlayer:wifi");
            wifi.setReferenceCounted(false);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // must enter foreground immediately after startForegroundService()
        if (pending != null) { state = pending; pending = null; }
        goForeground();
        String a = intent != null ? intent.getAction() : null;
        if (A_TOGGLE.equals(a)) cmd("toggle", null);
        else if (A_NEXT.equals(a)) cmd("next", null);
        else if (A_PREV.equals(a)) cmd("prev", null);
        else if (A_CLOSE.equals(a)) { cmd("stop", null); shutdown(); }
        else update(state);
        return START_NOT_STICKY;
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // app swiped away from recents while paused → clean up; while playing → keep going
        if (!state.optBoolean("playing")) shutdown();
    }

    @Override
    public void onDestroy() {
        releaseLocks();
        if (session != null) { session.setActive(false); session.release(); }
        if (instance == this) instance = null;
        super.onDestroy();
    }

    // ---------- logic ----------

    private void cmd(String c, String arg) {
        String js = "window.__scMedia&&window.__scMedia('" + c + "'" + (arg != null ? "," + arg : "") + ")";
        if (!MainActivity.js(js)) {
            // UI is gone (activity destroyed) — nothing can play anymore
            if (!"pause".equals(c)) shutdown();
        }
    }

    private void update(JSONObject s) {
        state = s;
        boolean playing = s.optBoolean("playing"), loading = s.optBoolean("loading");
        long pos = s.optLong("position", 0), dur = s.optLong("duration", 0);

        String url = s.optString("artwork", "").replace("-large.", "-t500x500.");
        if (!url.equals(artUrl)) { artUrl = url; art = null; loadArt(url); }

        MediaMetadataCompat.Builder md = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, String.valueOf(s.optLong("id")))
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, s.optString("title", ""))
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, s.optString("artist", ""))
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, dur > 0 ? dur : -1);
        if (art != null) md.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
        session.setMetadata(md.build());

        int st = loading ? PlaybackStateCompat.STATE_BUFFERING : playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        session.setPlaybackState(new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                        | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_STOP)
                .setState(st, pos, playing ? 1f : 0f)
                .build());

        if (playing || loading) acquireLocks(); else releaseLocks();
        goForeground();
    }

    private void goForeground() {
        Notification n = buildNotification();
        try {
            if (!foreground) {
                ServiceCompat.startForeground(this, NOTIF_ID, n,
                        Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0);
                foreground = true;
            } else {
                ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF_ID, n);
            }
        } catch (Exception e) {
            // e.g. ForegroundServiceStartNotAllowedException — give up quietly
            stopSelf();
        }
    }

    private PendingIntent action(String a, int req) {
        Intent i = new Intent(this, PlaybackService.class).setAction(a);
        return PendingIntent.getService(this, req, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification buildNotification() {
        boolean playing = state.optBoolean("playing");
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(state.optString("title", getString(R.string.app_name)))
                .setContentText(state.optString("artist", ""))
                .setLargeIcon(art)
                .setColor(0xFFFF5500)
                .setContentIntent(session.getController().getSessionActivity())
                .setDeleteIntent(action(A_CLOSE, 4))
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setOngoing(playing)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(R.drawable.ic_prev, getString(R.string.prev), action(A_PREV, 1))
                .addAction(playing ? R.drawable.ic_pause : R.drawable.ic_play, getString(playing ? R.string.pause : R.string.play), action(A_TOGGLE, 2))
                .addAction(R.drawable.ic_next, getString(R.string.next), action(A_NEXT, 3))
                .addAction(R.drawable.ic_close, getString(R.string.close), action(A_CLOSE, 4))
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(session.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2));
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }

    private void loadArt(final String url) {
        if (url.isEmpty()) return;
        new Thread(() -> {
            Bitmap bmp = null;
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                try (InputStream in = c.getInputStream()) { bmp = BitmapFactory.decodeStream(in); }
                if (bmp != null && bmp.getWidth() > 512) bmp = Bitmap.createScaledBitmap(bmp, 512, 512 * bmp.getHeight() / bmp.getWidth(), true);
            } catch (Exception ignored) {
            } finally { if (c != null) c.disconnect(); }
            final Bitmap result = bmp;
            main.post(() -> {
                if (result != null && url.equals(artUrl) && instance == this) { art = result; update(state); }
            });
        }, "sc-artwork").start();
    }

    private void acquireLocks() {
        try { if (!wake.isHeld()) wake.acquire(6 * 60 * 60 * 1000L); } catch (Exception ignored) { }
        try { if (wifi != null && !wifi.isHeld()) wifi.acquire(); } catch (Exception ignored) { }
    }

    private void releaseLocks() {
        try { if (wake != null && wake.isHeld()) wake.release(); } catch (Exception ignored) { }
        try { if (wifi != null && wifi.isHeld()) wifi.release(); } catch (Exception ignored) { }
    }

    private void shutdown() {
        releaseLocks();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        foreground = false;
        stopSelf();
    }
}
