package com.soundclouddl.player;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Process;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.NonNull;
import androidx.media.MediaBrowserServiceCompat;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Foreground "mediaPlayback" service: keeps the process alive while music plays in the WebView,
 * shows a media notification (lock screen / quick settings controls) and forwards button presses
 * back to the web player via window.__scMedia(cmd, arg).
 *
 * It is also the MediaBrowserService for Android Auto (same MediaSession — there is no second player) and
 * pushes every real state change to the home-screen widget.
 */
public class PlaybackService extends MediaBrowserServiceCompat {

    static final String CHANNEL = "playback";
    private static final int NOTIF_ID = 1001;
    static final String A_TOGGLE = "sc.toggle", A_NEXT = "sc.next", A_PREV = "sc.prev", A_CLOSE = "sc.close";
    /** Android Auto / Automotive / the Auto desktop head unit; any other caller gets an empty tree */
    private static final Set<String> BROWSERS = new HashSet<>(Arrays.asList(
            "com.google.android.projection.gearhead", "com.google.android.carassistant",
            "com.google.android.autosimulator", "com.android.car.media"));

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
    private boolean started;           // started with startForegroundService (not only bound by Android Auto)
    private String artRaw = "";        // artwork URL exactly as the player sent it (key of the widget's saved cover)
    private String queueSig = "";

    // wake lock is held only for the rest of the current track + a small margin (renewed on every state update)
    private static final long LOCK_MARGIN_MS = 2 * 60 * 1000L;          // buffering / gap before the next track
    private static final long LOCK_UNKNOWN_MS = 15 * 60 * 1000L;        // duration unknown (live / still loading)
    private static final long LOCK_MAX_MS = 3 * 60 * 60 * 1000L;        // hard ceiling for very long mixes
    private final Runnable lockTimeout = this::releaseLocks;            // also drops the Wi-Fi lock (it has no timeout)

    // artwork: one background thread, newest request wins, older downloads are cancelled
    private final ExecutorService artExec = Executors.newSingleThreadExecutor(r -> new Thread(r, "sc-artwork"));
    private final AtomicInteger artGen = new AtomicInteger();
    private Future<?> artJob;
    private static final int ART_PX = 512;
    private static final int ART_MAX_BYTES = 4 * 1024 * 1024;

    // ---------- called from MainActivity (main thread) ----------

    static void onState(Context ctx, JSONObject s) {
        boolean changed = NowPlaying.save(ctx, s);
        if (s.optBoolean("stop")) { stop(ctx); PlayerWidget.updateAll(ctx); return; }
        if (instance != null && instance.started) { instance.update(s); if (changed) PlayerWidget.updateAll(ctx); return; }
        if (!s.optBoolean("playing") && !s.optBoolean("loading")) { // nothing playing: no foreground service
            if (instance != null) instance.update(s);                 // (Android Auto bound → it still sees the paused song)
            if (changed) PlayerWidget.updateAll(ctx);
            return;
        }
        pending = s;
        try {
            ContextCompat.startForegroundService(ctx, new Intent(ctx, PlaybackService.class));
        } catch (Exception ignored) { /* background start not allowed: will retry on next state */ }
    }

    static void stop(Context ctx) {
        pending = null;
        if (instance != null) instance.shutdown();
        else { NowPlaying.setPlaying(ctx, false); PlayerWidget.updateAll(ctx); }
    }

    /** the media service is running (started, with its notification) — the widget's buttons can control playback */
    static boolean isActive() { return instance != null && instance.started; }

    static boolean isPlaying() {
        PlaybackService p = instance;
        return p != null && p.started && (p.state.optBoolean("playing") || p.state.optBoolean("loading"));
    }

    /** the web UI pushed a new library snapshot → Android Auto refreshes its lists */
    static void libraryChanged() {
        final PlaybackService p = instance;
        if (p == null) return;
        p.main.post(() -> {
            for (String id : new String[]{AutoLib.ROOT, "fav", "pls", "off", "rec"}) {
                try { p.notifyChildrenChanged(id); } catch (Exception ignored) { }
            }
        });
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
            // Android Auto: a song from the browse tree / the queue
            @Override public void onPlayFromMediaId(String mediaId, Bundle extras) {
                if (mediaId == null || !mediaId.startsWith("t|")) return;
                int bar = mediaId.lastIndexOf('|');
                if (bar <= 2) return;
                try {
                    JSONObject a = new JSONObject().put("list", mediaId.substring(2, bar)).put("id", Long.parseLong(mediaId.substring(bar + 1)));
                    cmd("playid", JSONObject.quote(a.toString()));
                } catch (Exception ignored) { }
            }
            @Override public void onSkipToQueueItem(long qid) { cmd("qi", String.valueOf(qid)); }
        });
        Intent open = new Intent(this, MainActivity.class).setAction(PlayerWidget.A_OPEN_PLAYER).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        session.setSessionActivity(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        session.setActive(true);
        setSessionToken(session.getSessionToken());
        restoreLastForBrowsers();

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
        started = true;
        if (pending != null) { state = pending; pending = null; }
        goForeground();
        String a = intent != null ? intent.getAction() : null;
        if ((A_TOGGLE.equals(a) || A_NEXT.equals(a) || A_PREV.equals(a)) && !MainActivity.alive()) {
            // a widget / notification button, but the player UI is gone (app closed): nothing can play
            shutdown();
            return START_NOT_STICKY;
        }
        if (A_TOGGLE.equals(a)) cmd("toggle", null);
        else if (A_NEXT.equals(a)) cmd("next", null);
        else if (A_PREV.equals(a)) cmd("prev", null);
        else if (A_CLOSE.equals(a)) { cmd("stop", null); shutdown(); }
        else update(state);
        PlayerWidget.updateAll(this);
        return START_NOT_STICKY;
    }

    @Override public IBinder onBind(Intent intent) { return super.onBind(intent); }

    // ---------- Android Auto (MediaBrowserService) ----------

    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, Bundle rootHints) {
        // media resumption ("recent") would ask us to start playback with no UI → not offered (it couldn't play)
        if (rootHints != null && rootHints.getBoolean(BrowserRoot.EXTRA_RECENT)) return null;
        boolean trusted = trusted(clientPackageName, clientUid);
        Bundle extras = new Bundle();
        extras.putBoolean("android.media.browse.CONTENT_STYLE_SUPPORTED", true);
        extras.putInt("android.media.browse.CONTENT_STYLE_BROWSABLE_HINT", 1);
        extras.putInt("android.media.browse.CONTENT_STYLE_PLAYABLE_HINT", 1);
        return new BrowserRoot(trusted ? AutoLib.ROOT : "empty", extras);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        boolean ok;
        try {
            androidx.media.MediaSessionManager.RemoteUserInfo who = getCurrentBrowserInfo();
            ok = who != null && trusted(who.getPackageName(), who.getUid());
        } catch (Exception e) { ok = false; }
        // the library is private: only Android Auto / this app may list it, whatever id another client asks for
        if (!ok || "empty".equals(parentId)) { result.sendResult(new ArrayList<>()); return; }
        result.sendResult(AutoLib.children(this, parentId));
    }

    private static boolean trusted(String pkg, int uid) {
        return uid == Process.myUid() || uid == Process.SYSTEM_UID || (pkg != null && BROWSERS.contains(pkg));
    }

    /** a browser (Auto) connected while nothing has played in this process yet → show the last saved song, paused */
    private void restoreLastForBrowsers() {
        NowPlaying np = NowPlaying.read(this);
        if (np.id <= 0) return;
        session.setMetadata(new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, String.valueOf(np.id))
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, np.title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, np.artist).build());
        if (MainActivity.alive()) setPaused(0); else showOpenAppError();
    }

    private void setPaused(long pos) {
        session.setPlaybackState(new PlaybackStateCompat.Builder().setActions(ACTIONS)
                .setState(PlaybackStateCompat.STATE_PAUSED, pos, 0f).build());
    }

    /** the player lives in the app's UI; without it nothing can play → say so honestly (no fake "playing") */
    private void showOpenAppError() {
        String msg = NowPlaying.localized(this, NowPlaying.appLang(this)).getString(R.string.auto_open_app);
        session.setPlaybackState(new PlaybackStateCompat.Builder().setActions(ACTIONS)
                .setState(PlaybackStateCompat.STATE_ERROR, 0, 0f)
                .setErrorMessage(PlaybackStateCompat.ERROR_CODE_APP_ERROR, msg).build());
    }

    private static final long ACTIONS = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
            | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_STOP
            | PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID | PlaybackStateCompat.ACTION_SKIP_TO_QUEUE_ITEM;

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // app swiped away from recents while paused → clean up; while playing → keep going
        if (!state.optBoolean("playing")) shutdown();
    }

    @Override
    public void onDestroy() {
        releaseLocks();
        main.removeCallbacks(lockTimeout);
        artGen.incrementAndGet();
        if (artJob != null) artJob.cancel(true);
        artExec.shutdownNow();
        if (session != null) { session.setActive(false); session.release(); }
        if (instance == this) instance = null;
        NowPlaying.setPlaying(this, false);
        PlayerWidget.updateAll(this);
        super.onDestroy();
    }

    // ---------- logic ----------

    private void cmd(String c, String arg) {
        String js = "window.__scMedia&&window.__scMedia('" + c + "'" + (arg != null ? "," + arg : "") + ")";
        if (!MainActivity.js(js)) {
            // UI is gone (activity destroyed) — nothing can play anymore
            if (!"pause".equals(c)) shutdown();
            showOpenAppError(); // Android Auto shows this message instead of a silent no-op
        }
    }

    private void update(JSONObject s) {
        try {
            applyState(s);
        } catch (RuntimeException e) {
            // never leave a wake lock / Wi-Fi lock behind because of a bad state update
            releaseLocks();
            throw e;
        }
    }

    private void applyState(JSONObject s) {
        state = s;
        boolean playing = s.optBoolean("playing"), loading = s.optBoolean("loading");
        long pos = s.optLong("position", 0), dur = s.optLong("duration", 0);
        float rate = (float) s.optDouble("rate", 1.0); if (!(rate >= 0.5f && rate <= 3f)) rate = 1f; // speed chosen in the app (0.75×…2×) → notification/lock-screen progress stays in step

        String raw = s.optString("artwork", "");
        String url = raw.replace("-large.", "-t500x500.");
        if (!url.equals(artUrl)) { artUrl = url; artRaw = raw; art = null; loadArt(url); }

        MediaMetadataCompat.Builder md = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, String.valueOf(s.optLong("id")))
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, s.optString("title", ""))
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, s.optString("artist", ""))
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, dur > 0 ? dur : -1);
        if (art != null) md.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
        session.setMetadata(md.build());

        updateQueue(s);
        int st = loading ? PlaybackStateCompat.STATE_BUFFERING : playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat.Builder pb = new PlaybackStateCompat.Builder()
                .setActions(ACTIONS)
                .setState(st, pos, playing ? rate : 0f);
        if (s.has("qi")) pb.setActiveQueueItemId(s.optLong("qi", -1));
        session.setPlaybackState(pb.build());

        if (!started) return; // only bound by Android Auto while nothing plays: no foreground service, no locks
        if (playing || loading) acquireLocks(lockDuration(playing, pos, dur)); else releaseLocks();
        goForeground();
    }

    /** the player's real queue (sent by the web UI only when it changes) → Android Auto's "queue" screen */
    private void updateQueue(JSONObject s) {
        JSONArray q = s.optJSONArray("queue");
        if (q == null) return;
        String sig = q.toString();
        if (sig.equals(queueSig)) return;
        queueSig = sig;
        List<MediaSessionCompat.QueueItem> items = new ArrayList<>();
        int base = s.optInt("qbase", 0);
        for (int i = 0; i < q.length() && i < 100; i++) {
            JSONObject t = q.optJSONObject(i);
            if (t == null) continue;
            MediaDescriptionCompat d = new MediaDescriptionCompat.Builder()
                    .setMediaId("q|" + (base + i) + "|" + t.optLong("id"))
                    .setTitle(t.optString("title", "")).setSubtitle(t.optString("artist", "")).build();
            items.add(new MediaSessionCompat.QueueItem(d, base + i));
        }
        session.setQueue(items);
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
            // e.g. ForegroundServiceStartNotAllowedException — give up quietly, without holding any lock
            releaseLocks();
            started = false;
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

    /** Downloads the cover off the main thread; a newer track cancels the older download. */
    private void loadArt(final String url) {
        final int gen = artGen.incrementAndGet();
        if (artJob != null) { artJob.cancel(true); artJob = null; }
        if (url.isEmpty() || !url.startsWith("https://")) return;
        try {
            artJob = artExec.submit(() -> {
                final Bitmap result = fetchArt(url, gen);
                if (result == null) return;
                final String key = artRaw;
                NowPlaying.saveArt(this, result, key); // the widget's copy of this cover (also after a reboot)
                main.post(() -> {
                    if (gen == artGen.get() && url.equals(artUrl) && instance == this) { art = result; update(state); PlayerWidget.updateAll(this); }
                    else result.recycle();
                });
            });
        } catch (Exception ignored) { /* executor shut down */ }
    }

    /** Bounds-first decode: read the header, pick a power-of-two inSampleSize for ~ART_PX, then decode once. */
    private Bitmap fetchArt(String url, int gen) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            if (c.getResponseCode() != 200) return null;
            byte[] data;
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[16 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) {
                    if (gen != artGen.get() || Thread.currentThread().isInterrupted()) return null; // superseded
                    out.write(buf, 0, n);
                    if (out.size() > ART_MAX_BYTES) return null;
                }
                data = out.toByteArray();
            }
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, o);
            if (o.outWidth <= 0 || o.outHeight <= 0) return null;
            int sample = 1;
            while (Math.max(o.outWidth, o.outHeight) / (sample * 2) >= ART_PX) sample *= 2;
            o = new BitmapFactory.Options();
            o.inSampleSize = sample;
            o.inPreferredConfig = Bitmap.Config.ARGB_8888;
            if (gen != artGen.get()) return null;
            Bitmap bmp = BitmapFactory.decodeByteArray(data, 0, data.length, o);
            if (bmp != null && Math.max(bmp.getWidth(), bmp.getHeight()) > ART_PX) {
                float k = (float) ART_PX / Math.max(bmp.getWidth(), bmp.getHeight());
                Bitmap scaled = Bitmap.createScaledBitmap(bmp, Math.max(1, Math.round(bmp.getWidth() * k)), Math.max(1, Math.round(bmp.getHeight() * k)), true);
                if (scaled != bmp) bmp.recycle();
                bmp = scaled;
            }
            return bmp;
        } catch (Exception | OutOfMemoryError ignored) {
            return null;
        } finally { if (c != null) c.disconnect(); }
    }

    /** remaining time of the current track + margin (bounded); unknown duration → a short default */
    static long lockDuration(boolean playing, long posMs, long durMs) {
        if (!playing || durMs <= 0) return LOCK_UNKNOWN_MS;
        long left = Math.max(0, durMs - Math.max(0, posMs));
        return Math.min(LOCK_MAX_MS, left + LOCK_MARGIN_MS);
    }

    private void acquireLocks(long timeoutMs) {
        try {
            // non-reference-counted: acquiring again just moves the timeout → renewed on every track / seek / play
            wake.acquire(timeoutMs);
            if (wifi != null && !wifi.isHeld()) wifi.acquire();
            main.removeCallbacks(lockTimeout);
            main.postDelayed(lockTimeout, timeoutMs);
        } catch (Exception e) {
            releaseLocks();
        }
    }

    private void releaseLocks() {
        main.removeCallbacks(lockTimeout);
        try { if (wake != null && wake.isHeld()) wake.release(); } catch (Exception ignored) { }
        try { if (wifi != null && wifi.isHeld()) wifi.release(); } catch (Exception ignored) { }
    }

    private void shutdown() {
        releaseLocks();
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        foreground = false;
        started = false;
        try { if (session != null) setPaused(state.optLong("position", 0)); } catch (Exception ignored) { }
        NowPlaying.setPlaying(this, false);
        PlayerWidget.updateAll(this); // → "stopped", taps open the app
        stopSelf();                   // stays alive only while Android Auto is still bound
    }
}
