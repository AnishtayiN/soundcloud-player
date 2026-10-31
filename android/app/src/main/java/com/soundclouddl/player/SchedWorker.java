package com.soundclouddl.player;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.os.StatFs;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

/**
 * Scheduled downloads while the app is closed (WorkManager). Runs only inside the user's window / weekdays,
 * with Wi-Fi (unmetered) and charging as real WorkManager constraints. Every song is first written to
 * bgdl/<id>.part and only renamed when it is complete; leaving the window, losing Wi-Fi, a cancel from the
 * notification or a system stop deletes the partial file — the song starts again in the next window.
 * Finished songs are handed to the app (SCNative.schedTake) and stored in its offline library on the next launch.
 */
public class SchedWorker extends Worker {

    static final int NOTIF_ID = 1201, DONE_ID = 1202;
    private static final long RUN_BUDGET_MS = 8 * 60 * 1000L; // JobScheduler stops a job after 10 min → continue in a new run
    private static final int QKBPS_HIGH = 162, QKBPS_LOW = 97;  // same estimate as the app (QKBPS / offEstimate)
    static volatile long running;                               // id of the song being downloaded (0 = idle)

    public SchedWorker(@NonNull Context ctx, @NonNull WorkerParameters params) { super(ctx, params); }

    static boolean isFinished(Context ctx, long id) {
        File d = new File(Bg.dlDir(ctx), String.valueOf(id));
        if (new File(d, "meta.json").isFile()) return true;
        JSONObject failed = Bg.json(ctx, "sched_failed");
        return failed.has(String.valueOf(id));
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        try { return run(ctx); }
        finally {
            running = 0;
            Bg.cleanPartials(ctx);
        }
    }

    private Result run(Context ctx) {
        JSONObject cfg = Bg.json(ctx, "sched");
        if (!cfg.optBoolean("on") || cfg.optString("token", "").isEmpty()) return Result.success();
        if (MainActivity.alive()) { MainActivity.event("sched"); return Result.success(); } // the open app downloads itself
        if (!Bg.inWindow(cfg, Calendar.getInstance())) { Bg.scheduleSched(ctx, cfg, true); return Result.success(); }

        String base = Bg.apiBase(ctx, cfg.optString("api", ""));
        String token = cfg.optString("token", "");
        long limit = cfg.optLong("limitMB", 0) * 1048576L;
        long used = cfg.optLong("usedBytes", 0);
        List<JSONObject> todo = new ArrayList<>();
        JSONArray items = cfg.optJSONArray("items");
        for (int i = 0; items != null && i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            JSONObject t = it == null ? null : it.optJSONObject("t");
            if (t != null && t.optLong("id") > 0 && !isFinished(ctx, t.optLong("id"))) todo.add(it);
        }
        if (todo.isEmpty()) return Result.success();
        Bg.ensureDownloadChannel(ctx);
        Context lc = NowPlaying.localized(ctx, NowPlaying.appLang(ctx));
        long t0 = System.currentTimeMillis();
        int done = 0, n = todo.size();
        boolean windowEnded = false, budget = false;
        for (int i = 0; i < n; i++) {
            if (isStopped()) break;
            if (!Bg.inWindow(cfg, Calendar.getInstance())) { windowEnded = true; break; }
            if (System.currentTimeMillis() - t0 > RUN_BUDGET_MS) { budget = true; break; }
            if (MainActivity.alive()) { MainActivity.event("sched"); break; } // the app was opened → it takes over
            JSONObject it = todo.get(i), t = it.optJSONObject("t");
            long id = t.optLong("id");
            String q = "low".equals(it.optString("q")) ? "low" : "high";
            String preset = it.optString("preset", "");
            if (preset.equals("null")) preset = "";
            long est = Math.round(t.optLong("duration_ms", 0) / 1000.0 * (preset.matches(".*(96|64|low).*") || "low".equals(q) ? QKBPS_LOW : QKBPS_HIGH) * 125);
            long already = Bg.dirBytes(Bg.dlDir(ctx));
            // size checks BEFORE downloading: the user's offline limit and the real free space on this volume
            if (limit > 0 && used + already + est > limit) { fail(ctx, id, "big"); continue; }
            if (new StatFs(ctx.getFilesDir().getPath()).getAvailableBytes() < est * 2 + 50L * 1048576L) { fail(ctx, id, "room"); break; }
            running = id;
            progress(ctx, lc, i + 1, n, t.optString("title", ""), -1);
            try {
                if (download(ctx, lc, base, token, t, q, preset, limit > 0 ? limit - used - already : Long.MAX_VALUE, i + 1, n, cfg)) done++;
                else if (isStopped()) break;
                else if (!Bg.inWindow(cfg, Calendar.getInstance())) { windowEnded = true; break; }
            } catch (Bg.HttpError e) {
                if (e.code == 401) { try { cfg.put("token", ""); Bg.put(ctx, "sched", cfg); } catch (Exception ignored) { } break; }
                if (e.code == 451 || e.code == 402) fail(ctx, id, "drm");
                else if (e.code == 404) fail(ctx, id, "q");
                else if (e.code == 413) fail(ctx, id, "big");
                // other errors (network): the song stays queued for the next run
            } catch (Exception e) {
                // network error / timeout → nothing partial is kept; the song stays queued
            } finally {
                running = 0;
                Bg.cleanPartials(ctx);
            }
        }
        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        nm.cancel(NOTIF_ID);
        if (done > 0 && Bg.canNotify(ctx)) {
            Notification d = new NotificationCompat.Builder(ctx, Bg.DL_CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF5500)
                    .setContentTitle(lc.getString(R.string.dl_done, Bg.dirCount(ctx)))
                    .setContentText(lc.getString(R.string.dl_done_sub))
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(lc.getString(R.string.dl_done_sub)))
                    .setContentIntent(PlayerWidget.openApp(ctx)).setAutoCancel(true).build();
            try { nm.notify(DONE_ID, d); } catch (SecurityException ignored) { }
        }
        if (windowEnded && Bg.canNotify(ctx)) {
            Notification w = new NotificationCompat.Builder(ctx, Bg.DL_CHANNEL)
                    .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF5500)
                    .setContentTitle(lc.getString(R.string.dl_channel)).setContentText(lc.getString(R.string.dl_window_end))
                    .setTimeoutAfter(30 * 60 * 1000L).setAutoCancel(true).build();
            try { nm.notify(NOTIF_ID + 2, w); } catch (SecurityException ignored) { }
        }
        if (isStopped()) return Result.success(); // canceled / constraints lost: WorkManager reschedules or the user canceled
        Bg.prefs(ctx).edit().putString("sched_last", (windowEnded ? "window-end" : budget ? "continue" : "done") + " ok=" + done + " at=" + System.currentTimeMillis()).apply();
        Bg.scheduleSched(ctx, Bg.json(ctx, "sched"), true); // the rest: right away (budget) or in the next window
        if (done > 0) MainActivity.event("sched");
        return Result.success();
    }

    private static void fail(Context ctx, long id, String why) {
        JSONObject f = Bg.json(ctx, "sched_failed");
        try { f.put(String.valueOf(id), why); } catch (Exception ignored) { }
        Bg.put(ctx, "sched_failed", f);
    }

    private void progress(Context ctx, Context lc, int i, int n, String title, int pct) {
        if (!Bg.canNotify(ctx)) return;
        Intent c = new Intent(ctx, SchedCancelReceiver.class).setAction(SchedCancelReceiver.ACTION);
        PendingIntent cancel = PendingIntent.getBroadcast(ctx, 1203, c, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, Bg.DL_CHANNEL)
                .setSmallIcon(R.drawable.ic_stat).setColor(0xFFFF5500)
                .setContentTitle(lc.getString(R.string.dl_title, i, n))
                .setContentText(title + (pct >= 0 ? " · " + pct + "%" : ""))
                .setProgress(100, Math.max(0, pct), pct < 0)
                .setOngoing(true).setOnlyAlertOnce(true).setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .addAction(R.drawable.ic_close, lc.getString(R.string.dl_cancel), cancel);
        try { NotificationManagerCompat.from(ctx).notify(NOTIF_ID, b.build()); } catch (SecurityException ignored) { }
    }

    /** @return true when the song is complete on disk (bgdl/<id>/ + meta.json) */
    private boolean download(Context ctx, Context lc, String base, String token, JSONObject t, String q, String preset, long room,
                             int i, int n, JSONObject cfg) throws Exception {
        long id = t.optLong("id");
        if (preset.isEmpty()) { // resolve "high"/"low" to one of THIS song's real options (same as the app)
            JSONObject o = Bg.getJson(base, "/stream/" + id + "/options", token);
            JSONArray opts = o.optJSONArray("options");
            if (opts == null || opts.length() == 0) throw new Bg.HttpError(404);
            JSONObject pick = "low".equals(q) ? opts.optJSONObject(opts.length() - 1) : opts.optJSONObject(0);
            preset = pick == null ? "" : pick.optString("preset", "");
            if (preset.isEmpty()) throw new Bg.HttpError(404);
        }
        JSONObject s = Bg.getJson(base, "/stream/" + id + "?preset=" + java.net.URLEncoder.encode(preset, "UTF-8"), token);
        String kind = s.optString("kind", ""), url = s.optString("url", "");
        if (!url.startsWith("https://") && !(Bg.debuggable(ctx) && url.startsWith("http://127.0.0.1:"))) throw new Bg.HttpError(404);
        File part = new File(Bg.dlDir(ctx), id + ".part");
        Bg.deleteTree(part);
        if (!part.mkdirs()) throw new java.io.IOException("mkdir");
        JSONObject meta = new JSONObject();
        meta.put("id", id).put("track", t).put("preset", s.optString("preset", preset)).put("saved", System.currentTimeMillis());
        if (s.has("track") && s.optJSONObject("track") != null) meta.put("track", merge(t, s.optJSONObject("track")));
        final String title = t.optString("title", "");
        if ("progressive".equals(kind)) {
            long got = fetch(url, new File(part, "audio"), room, (p) -> progress(ctx, lc, i, n, title, p), cfg);
            if (got <= 0) return false;
            meta.put("kind", "progressive").put("files", new JSONArray().put("audio")).put("bytes", got);
        } else {
            // HLS: playlist (+ variant) → init segment (fMP4/AAC) + media segments; the app remuxes them on import
            String txt = text(url);
            if (txt.contains("#EXT-X-STREAM-INF")) {
                for (String l : txt.split("\n")) { l = l.trim(); if (!l.isEmpty() && !l.startsWith("#")) { url = new URL(new URL(url), l).toString(); break; } }
                txt = text(url);
            }
            JSONArray files = new JSONArray();
            boolean init = false;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("#EXT-X-MAP:URI=\"([^\"]+)\"").matcher(txt);
            long bytes = 0;
            if (m.find()) { bytes += fetch(new URL(new URL(url), m.group(1)).toString(), new File(part, "init"), room, null, cfg); init = true; }
            List<String> segs = new ArrayList<>();
            for (String l : txt.split("\n")) { l = l.trim(); if (!l.isEmpty() && !l.startsWith("#")) segs.add(new URL(new URL(url), l).toString()); }
            if (segs.isEmpty()) throw new Bg.HttpError(404);
            for (int k = 0; k < segs.size(); k++) {
                if (isStopped() || !Bg.inWindow(cfg, Calendar.getInstance())) return false;
                long b = fetch(segs.get(k), new File(part, "s" + k), room - bytes, null, cfg);
                if (b <= 0) return false;
                bytes += b;
                files.put("s" + k);
                if (k % 3 == 0) progress(ctx, lc, i, n, title, (int) (100L * (k + 1) / segs.size()));
            }
            meta.put("kind", init ? "hls-aac" : "hls-mp3").put("init", init).put("files", files).put("bytes", bytes);
        }
        if (isStopped() || !Bg.inWindow(cfg, Calendar.getInstance())) return false;
        try (OutputStream out = new FileOutputStream(new File(part, "meta.json"))) { out.write(meta.toString().getBytes(StandardCharsets.UTF_8)); }
        File dst = new File(Bg.dlDir(ctx), String.valueOf(id));
        Bg.deleteTree(dst);
        return part.renameTo(dst);
    }

    private static JSONObject merge(JSONObject a, JSONObject b) throws Exception {
        JSONObject m = new JSONObject(a.toString());
        for (java.util.Iterator<String> it = b.keys(); it.hasNext(); ) { String k = it.next(); if (!b.isNull(k)) m.put(k, b.get(k)); }
        return m;
    }

    interface Prog { void on(int pct); }

    private static String text(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setConnectTimeout(15000); c.setReadTimeout(20000);
            if (c.getResponseCode() != 200) throw new Bg.HttpError(c.getResponseCode() == 404 ? 404 : 502);
            try (InputStream in = c.getInputStream()) {
                java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
                byte[] b = new byte[8192]; int r;
                while ((r = in.read(b)) > 0) { out.write(b, 0, r); if (out.size() > 2_000_000) throw new Bg.HttpError(413); }
                return new String(out.toByteArray(), StandardCharsets.UTF_8);
            }
        } finally { c.disconnect(); }
    }

    /** streams one file to disk; stops (returns 0) the moment the job is stopped, the window closes or Wi-Fi is lost */
    private long fetch(String url, File dst, long room, Prog prog, JSONObject cfg) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setConnectTimeout(15000); c.setReadTimeout(30000);
            int code = c.getResponseCode();
            if (code != 200) throw new Bg.HttpError(code == 404 || code == 403 ? 404 : 502);
            long len = c.getContentLengthLong();
            if (len > room) throw new Bg.HttpError(413);
            long got = 0, lastAt = 0; int lastPct = -1;
            ConnectivityManager cm = (ConnectivityManager) getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(dst)) {
                byte[] b = new byte[32768]; int r;
                while ((r = in.read(b)) > 0) {
                    if (isStopped()) return 0;
                    out.write(b, 0, r); got += r;
                    if (got > room) throw new Bg.HttpError(413);
                    long now = System.currentTimeMillis();
                    if (now - lastAt > 1000) {
                        lastAt = now;
                        if (!Bg.inWindow(cfg, Calendar.getInstance())) return 0;
                        if (cfg.optBoolean("wifi", true) && cm != null && cm.isActiveNetworkMetered()) return 0;
                        if (prog != null && len > 0) { int p = (int) (100 * got / len); if (p != lastPct) { lastPct = p; prog.on(p); } }
                    }
                }
            }
            if (len > 0 && got != len) return 0; // truncated → not complete
            return got;
        } finally { c.disconnect(); }
    }

    // ───────────── hand-over to the app ─────────────

    /** SCNative.schedTake(): finished songs (still on disk until schedAck), failures and a pending cancel */
    static synchronized String take(Context ctx) {
        JSONObject out = new JSONObject();
        try {
            JSONArray done = new JSONArray();
            File[] kids = Bg.dlDir(ctx).listFiles();
            if (kids != null) for (File k : kids) {
                if (k.getName().endsWith(".part") || !k.isDirectory()) continue;
                File mf = new File(k, "meta.json");
                if (!mf.isFile()) { Bg.deleteTree(k); continue; }
                byte[] b = new byte[(int) Math.min(mf.length(), 1_000_000)];
                try (InputStream in = new java.io.FileInputStream(mf)) { int off = 0, r; while (off < b.length && (r = in.read(b, off, b.length - off)) > 0) off += r; }
                done.put(new JSONObject(new String(b, StandardCharsets.UTF_8)));
            }
            out.put("done", done);
            out.put("failed", Bg.json(ctx, "sched_failed"));
            JSONObject cfg = Bg.json(ctx, "sched");
            out.put("canceled", cfg.optBoolean("canceled"));
            out.put("busy", running);
            out.put("next", Bg.prefs(ctx).getLong("sched_next", 0));
            out.put("last", Bg.prefs(ctx).getString("sched_last", ""));
            Bg.put(ctx, "sched_failed", new JSONObject());
            if (cfg.optBoolean("canceled")) { cfg.remove("canceled"); Bg.put(ctx, "sched", cfg); }
        } catch (Exception ignored) { }
        return out.toString();
    }

    /** the app stored the song in its offline library → delete our copy */
    static synchronized void ack(Context ctx, long id) {
        if (id <= 0) return;
        Bg.deleteTree(new File(Bg.dlDir(ctx), String.valueOf(id)));
    }
}
