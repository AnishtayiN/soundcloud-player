package com.soundclouddl.player;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.concurrent.TimeUnit;

/**
 * Background work shared by the release check (ReleaseWorker) and scheduled downloads (SchedWorker):
 * the settings the web UI hands over (SCNative.bgSync / schedSet), the API client and notifications.
 * Only the existing app identity (the sc_token of the signed-in user) is used — no new keys or secrets.
 */
final class Bg {
    static final String API = "https://fywphggwavthubehvvuh.supabase.co/functions/v1/scbot/api";
    static final String DL_CHANNEL = "downloads";
    static final String W_REL = "release-check", W_SCHED = "sched-dl", W_SCHED_NOW = "sched-dl-now";
    private static final String PREFS = "background";

    private Bg() { }

    static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static JSONObject json(Context ctx, String key) {
        try { return new JSONObject(prefs(ctx).getString(key, "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static void put(Context ctx, String key, JSONObject o) { prefs(ctx).edit().putString(key, o.toString()).apply(); }

    static boolean debuggable(Context ctx) { return (ctx.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0; }

    /** The API the background jobs may call: always the app's own backend. Debug builds may point at a local mock. */
    static String apiBase(Context ctx, String requested) {
        if (requested != null && debuggable(ctx) && requested.matches("http://127\\.0\\.0\\.1:\\d{2,5}/api")) return requested;
        return API;
    }

    static final class HttpError extends Exception {
        final int code;
        HttpError(int code) { super("http " + code); this.code = code; }
    }

    static JSONObject getJson(String base, String path, String token) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(base + path).openConnection();
        try {
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setRequestProperty("Content-Type", "application/json");
            if (token != null && !token.isEmpty()) c.setRequestProperty("x-app-token", token);
            int code = c.getResponseCode();
            if (code != 200) throw new HttpError(code);
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] b = new byte[16384];
                int n;
                while ((n = in.read(b)) > 0) { out.write(b, 0, n); if (out.size() > 4_000_000) throw new HttpError(413); }
                return new JSONObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
            }
        } finally { c.disconnect(); }
    }

    // ───────────── new releases (WorkManager, ~ every 6 h, network required) ─────────────

    /** settings from SCNative.bgSync → (re)schedule or cancel the periodic check */
    static void syncReleases(Context ctx, String json) {
        JSONObject cfg;
        try { cfg = new JSONObject(json); } catch (Exception e) { return; }
        JSONObject old = json(ctx, "rel");
        // keep what the background job learned since the web UI last saw it (seen ids / alert day)
        JSONArray list = cfg.optJSONArray("list");
        JSONArray oldList = old.optJSONArray("list");
        if (list != null && oldList != null) {
            for (int i = 0; i < list.length(); i++) {
                JSONObject f = list.optJSONObject(i);
                if (f == null) continue;
                for (int k = 0; k < oldList.length(); k++) {
                    JSONObject o = oldList.optJSONObject(k);
                    if (o == null || o.optLong("id") != f.optLong("id")) continue;
                    try {
                        JSONArray seen = f.optJSONArray("seen"); if (seen == null) { seen = new JSONArray(); f.put("seen", seen); }
                        JSONArray os = o.optJSONArray("seen");
                        for (int j = 0; os != null && j < os.length(); j++) if (!contains(seen, os.optLong(j))) seen.put(os.optLong(j));
                        // the background job already sent today's summary for this artist → the web copy must not reset it
                        if (dayKey().equals(o.optString("alert_day", ""))) f.put("alert_day", dayKey());
                    } catch (Exception ignored) { }
                }
            }
        }
        put(ctx, "rel", cfg);
        NowPlaying.setLang(ctx, cfg.optString("lang", ""));
        boolean on = cfg.optBoolean("enabled") && !cfg.optString("token", "").isEmpty() && list != null && list.length() > 0;
        WorkManager wm = WorkManager.getInstance(ctx);
        if (!on) { wm.cancelUniqueWork(W_REL); return; }
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(ReleaseWorker.class, 6, TimeUnit.HOURS, 1, TimeUnit.HOURS)
                .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setInitialDelay(6, TimeUnit.HOURS) // the app itself checks on start; the background job takes over from here
                .addTag("rel")
                .build();
        wm.enqueueUniquePeriodicWork(W_REL, ExistingPeriodicWorkPolicy.KEEP, req);
    }

    static boolean contains(JSONArray a, long v) {
        for (int i = 0; a != null && i < a.length(); i++) if (a.optLong(i) == v) return true;
        return false;
    }

    /** same key as the web UI: `${y}-${m+1}-${d}` in local time */
    static String dayKey() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.YEAR) + "-" + (c.get(Calendar.MONTH) + 1) + "-" + c.get(Calendar.DAY_OF_MONTH);
    }

    /** a manual run (testing / "check now" from adb in debug builds): same worker, same rules */
    static void runReleaseCheckNow(Context ctx) {
        WorkManager.getInstance(ctx).enqueueUniqueWork(W_REL + "-now", ExistingWorkPolicy.REPLACE,
                new OneTimeWorkRequest.Builder(ReleaseWorker.class)
                        .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build());
    }

    // ───────────── notifications ─────────────

    static void ensurePlaybackChannel(Context ctx) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(PlaybackService.CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(PlaybackService.CHANNEL, ctx.getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
    }

    static void ensureDownloadChannel(Context ctx) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(DL_CHANNEL) == null) {
            Context lc = NowPlaying.localized(ctx, NowPlaying.appLang(ctx));
            NotificationChannel ch = new NotificationChannel(DL_CHANNEL, lc.getString(R.string.dl_channel), NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
    }

    static boolean canNotify(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        return NotificationManagerCompat.from(ctx).areNotificationsEnabled();
    }

    /** "t_<id>" → opens that song, "a_<id>" → the artist page (same routes as the app links) */
    static PendingIntent openLink(Context ctx, String link, int req) {
        Intent i = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (link != null && link.matches("[ta]_\\d{1,15}")) i.setAction(Intent.ACTION_VIEW).setData(Uri.parse("scplayer://" + link.charAt(0) + "/" + link.substring(2)));
        return PendingIntent.getActivity(ctx, req, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** a release alert on the app's existing notification channel */
    static boolean notice(Context ctx, int id, String title, String body, String link) {
        if (!canNotify(ctx)) return false;
        ensurePlaybackChannel(ctx);
        Notification n = new NotificationCompat.Builder(ctx, PlaybackService.CHANNEL)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(0xFFFF5500)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(openLink(ctx, link, 3000 + (id % 9000)))
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build();
        try { NotificationManagerCompat.from(ctx).notify("rel", id, n); return true; } catch (SecurityException e) { return false; }
    }

    // ───────────── scheduled downloads ─────────────

    static File dlDir(Context ctx) {
        File d = new File(ctx.getFilesDir(), "bgdl");
        if (!d.isDirectory()) d.mkdirs();
        return d;
    }

    static void deleteTree(File f) {
        if (f == null || !f.exists()) return;
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteTree(k);
        f.delete();
    }

    /** removes every unfinished download (*.part) — a stopped / canceled download never leaves a partial file */
    static void cleanPartials(Context ctx) {
        File[] kids = dlDir(ctx).listFiles();
        if (kids != null) for (File k : kids) if (k.getName().endsWith(".part")) deleteTree(k);
    }

    /** finished songs waiting for the app (bgdl/<id>/meta.json) */
    static int dirCount(Context ctx) {
        int n = 0;
        File[] kids = dlDir(ctx).listFiles();
        if (kids != null) for (File k : kids) if (k.isDirectory() && new File(k, "meta.json").isFile()) n++;
        return n;
    }

    static long dirBytes(File f) {
        if (f == null || !f.exists()) return 0;
        if (f.isFile()) return f.length();
        long n = 0;
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) n += dirBytes(k);
        return n;
    }

    static int hm(String s) {
        try {
            String[] p = String.valueOf(s).split(":");
            return (Integer.parseInt(p[0]) % 24) * 60 + (p.length > 1 ? Integer.parseInt(p[1]) % 60 : 0);
        } catch (Exception e) { return 0; }
    }

    private static boolean hasDay(JSONArray days, int d) { return contains(days, d); }

    /** exactly the web UI's schInWindow(): a window crossing midnight belongs to the day it starts */
    static boolean inWindow(JSONObject cfg, Calendar now) {
        JSONArray days = cfg.optJSONArray("days");
        int f = hm(cfg.optString("from", "01:00")), t = hm(cfg.optString("to", "07:00"));
        int m = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE), day = now.get(Calendar.DAY_OF_WEEK) - 1;
        if (f == t) return hasDay(days, day);
        if (f < t) return m >= f && m < t && hasDay(days, day);
        if (m >= f) return hasDay(days, day);
        if (m < t) return hasDay(days, (day + 6) % 7);
        return false;
    }

    /** milliseconds until the next window opens (0 = open now, -1 = no day selected) */
    static long untilWindow(JSONObject cfg) {
        JSONArray days = cfg.optJSONArray("days");
        if (days == null || days.length() == 0) return -1;
        Calendar now = Calendar.getInstance();
        if (inWindow(cfg, now)) return 0;
        int f = hm(cfg.optString("from", "01:00"));
        for (int i = 0; i < 8; i++) {
            Calendar c = (Calendar) now.clone();
            c.add(Calendar.DAY_OF_MONTH, i);
            c.set(Calendar.HOUR_OF_DAY, f / 60); c.set(Calendar.MINUTE, f % 60); c.set(Calendar.SECOND, 5); c.set(Calendar.MILLISECOND, 0);
            if (c.after(now) && hasDay(days, c.get(Calendar.DAY_OF_WEEK) - 1)) return c.getTimeInMillis() - now.getTimeInMillis();
        }
        return -1;
    }

    static Constraints schedConstraints(JSONObject cfg) {
        return new Constraints.Builder()
                .setRequiredNetworkType(cfg.optBoolean("wifi", true) ? NetworkType.UNMETERED : NetworkType.CONNECTED)
                .setRequiresCharging(cfg.optBoolean("charge", false))
                .setRequiresStorageNotLow(true)
                .build();
    }

    /** queue + window from SCNative.schedSet (persisted; WorkManager keeps the job across reboots) */
    static void syncSched(Context ctx, String json) {
        JSONObject cfg;
        try { cfg = new JSONObject(json); } catch (Exception e) { return; }
        JSONObject old = json(ctx, "sched");
        try { if (old.optBoolean("canceled")) cfg.put("canceled", true); } catch (Exception ignored) { }
        put(ctx, "sched", cfg);
        NowPlaying.setLang(ctx, cfg.optString("lang", ""));
        scheduleSched(ctx, cfg, false);
    }

    static int pendingCount(Context ctx, JSONObject cfg) {
        JSONArray items = cfg.optJSONArray("items");
        int n = 0;
        for (int i = 0; items != null && i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            JSONObject t = it == null ? null : it.optJSONObject("t");
            if (t != null && t.optLong("id") > 0 && !SchedWorker.isFinished(ctx, t.optLong("id"))) n++;
        }
        return n;
    }

    /** next run = the next window start (WorkManager adds Wi-Fi / charging as real constraints) */
    static void scheduleSched(Context ctx, JSONObject cfg, boolean fromWorker) {
        WorkManager wm = WorkManager.getInstance(ctx);
        boolean on = cfg.optBoolean("on") && !cfg.optString("token", "").isEmpty() && pendingCount(ctx, cfg) > 0;
        long wait = on ? untilWindow(cfg) : -1;
        if (!on || wait < 0) {
            if (!fromWorker) { wm.cancelUniqueWork(W_SCHED); wm.cancelUniqueWork(W_SCHED_NOW); }
            prefs(ctx).edit().putLong("sched_next", 0).apply();
            return;
        }
        prefs(ctx).edit().putLong("sched_next", System.currentTimeMillis() + wait).apply();
        OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(SchedWorker.class)
                .setConstraints(schedConstraints(cfg))
                .setInitialDelay(wait, TimeUnit.MILLISECONDS)
                .addTag("sched")
                .build();
        wm.enqueueUniqueWork(W_SCHED, ExistingWorkPolicy.REPLACE, req);
    }

    /** run now (debug trigger / continuation after a long run); still honours the window inside the worker */
    static void runSchedNow(Context ctx) {
        JSONObject cfg = json(ctx, "sched");
        WorkManager.getInstance(ctx).enqueueUniqueWork(W_SCHED_NOW, ExistingWorkPolicy.REPLACE,
                new OneTimeWorkRequest.Builder(SchedWorker.class).setConstraints(schedConstraints(cfg)).addTag("sched").build());
    }
}
