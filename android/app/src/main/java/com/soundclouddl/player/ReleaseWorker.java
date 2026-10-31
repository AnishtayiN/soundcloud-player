package com.soundclouddl.player;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Background new-release check for followed artists (WorkManager, ~ every 6 h when online). Exactly the app's
 * 1.5.0 rules: only songs uploaded after the user followed the artist, each song once, at most one summary per
 * artist per day, muted artists / the global switch / unfollow are respected (the list comes from the app).
 * What it finds is stored for the app (SCNative.bgSeen) so the app never repeats an alert.
 */
public class ReleaseWorker extends Worker {

    public ReleaseWorker(@NonNull Context ctx, @NonNull WorkerParameters params) { super(ctx, params); }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        try { return run(ctx) ? Result.success() : Result.retry(); }
        catch (Exception e) { return Result.retry(); }
    }

    static String lastResult = "";

    /** @return false = temporary network problem (WorkManager retries with backoff) */
    static boolean run(Context ctx) throws Exception {
        JSONObject cfg = Bg.json(ctx, "rel");
        JSONArray list = cfg.optJSONArray("list");
        String token = cfg.optString("token", "");
        if (!cfg.optBoolean("enabled") || token.isEmpty() || list == null || list.length() == 0) { lastResult = "off"; return true; }
        if (MainActivity.inForeground()) { lastResult = "app-open"; return true; } // the open app checks by itself
        String base = Bg.apiBase(ctx, cfg.optString("api", ""));
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < list.length(); i++) { JSONObject f = list.optJSONObject(i); if (f != null && f.optLong("id") > 0) ids.add(f.optLong("id")); }
        JSONObject releases = new JSONObject();
        for (int i = 0; i < ids.size(); i += 60) {
            StringBuilder q = new StringBuilder();
            for (int k = i; k < Math.min(ids.size(), i + 60); k++) { if (q.length() > 0) q.append(','); q.append(ids.get(k)); }
            JSONObject r;
            try { r = Bg.getJson(base, "/releases?ids=" + q, token); }
            catch (Bg.HttpError e) {
                if (e.code == 401) { cfg.put("token", ""); Bg.put(ctx, "rel", cfg); lastResult = "signed-out"; return true; } // signed out → stop
                lastResult = "http " + e.code; return e.code < 500;
            }
            JSONObject rel = r.optJSONObject("releases");
            if (rel != null) for (java.util.Iterator<String> it = rel.keys(); it.hasNext(); ) { String k = it.next(); releases.put(k, rel.get(k)); }
        }

        JSONObject store = Bg.json(ctx, "news");   // what the app hasn't merged yet
        String today = Bg.dayKey();
        Context lc = NowPlaying.localized(ctx, "en".equals(cfg.optString("lang")) ? "en" : "fa");
        int total = 0, alerts = 0;
        for (int i = 0; i < list.length(); i++) {
            JSONObject f = list.optJSONObject(i);
            if (f == null) continue;
            JSONArray arr = releases.optJSONArray(String.valueOf(f.optLong("id")));
            if (arr == null) continue;
            JSONArray seen = f.optJSONArray("seen"); if (seen == null) { seen = new JSONArray(); f.put("seen", seen); }
            long followedAt = f.optLong("followed_at", 0);
            List<JSONObject> fresh = new ArrayList<>();
            for (int k = 0; k < arr.length(); k++) {
                JSONObject t = arr.optJSONObject(k);
                if (t == null || t.optLong("id") <= 0) continue;
                if (t.optLong("created_at", 0) > followedAt && !Bg.contains(seen, t.optLong("id"))) fresh.add(t);
            }
            if (fresh.isEmpty()) continue;
            total += fresh.size();
            JSONArray ns = new JSONArray();
            for (JSONObject t : fresh) ns.put(t.optLong("id"));
            for (int k = 0; k < seen.length() && ns.length() < 60; k++) ns.put(seen.optLong(k));
            f.put("seen", ns);
            String key = String.valueOf(f.optLong("id"));
            JSONObject e = store.optJSONObject(key); if (e == null) { e = new JSONObject(); store.put(key, e); }
            JSONArray news = e.optJSONArray("news"); if (news == null) { news = new JSONArray(); e.put("news", news); }
            JSONArray es = e.optJSONArray("seen"); if (es == null) { es = new JSONArray(); e.put("seen", es); }
            for (JSONObject t : fresh) { if (news.length() < 40) news.put(mini(t)); es.put(t.optLong("id")); }
            if (!f.optBoolean("muted") && !today.equals(f.optString("alert_day", ""))) { // max one summary per artist per day
                String name = f.optString("username", "");
                String title = fresh.size() > 1 ? lc.getString(R.string.rel_new_n, fresh.size(), name) : lc.getString(R.string.rel_new_one, name);
                StringBuilder body = new StringBuilder();
                for (int k = 0; k < Math.min(3, fresh.size()); k++) { if (k > 0) body.append(" · "); body.append(fresh.get(k).optString("title", "")); }
                String link = fresh.size() == 1 ? "t_" + fresh.get(0).optLong("id") : "a_" + f.optLong("id");
                if (Bg.notice(ctx, 3000 + (int) (f.optLong("id") % 90000), title, body.toString(), link)) alerts++;
                f.put("alert_day", today);
                e.put("alert_day", today);
            }
        }
        cfg.put("checked_at", System.currentTimeMillis());
        Bg.put(ctx, "rel", cfg);
        Bg.put(ctx, "news", store);
        lastResult = "ok fresh=" + total + " alerts=" + alerts;
        if (total > 0) MainActivity.event("bgnews");
        return true;
    }

    private static JSONObject mini(JSONObject t) throws Exception {
        JSONObject m = new JSONObject();
        for (String k : new String[]{"id", "title", "artist", "username", "user_id", "duration_ms", "genre", "artwork_url", "permalink_url", "created_at", "release_date"})
            if (t.has(k) && !t.isNull(k)) m.put(k, t.get(k));
        return m;
    }

    /** SCNative.bgSeen(): hands the found songs to the app once (the app merges them into its own list) */
    static synchronized String take(Context ctx) {
        JSONObject store = Bg.json(ctx, "news");
        Bg.put(ctx, "news", new JSONObject());
        return store.toString();
    }
}
