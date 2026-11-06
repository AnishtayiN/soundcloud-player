package com.soundclouddl.player;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.media.MediaBrowserCompat.MediaItem;
import android.support.v4.media.MediaDescriptionCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Android Auto browse tree: favorites / playlists / offline / recently played.
 * The web UI pushes a snapshot of the user's real library (SCNative.autoLib) whenever it changes; it is kept in
 * the app's private files so Auto can browse it even before the WebView has loaded. Media ids:
 * "fav" "pls" "off" "rec" (folders), "pl|<id>" (a playlist), "t|<list>|<trackId>" (a playable song).
 */
final class AutoLib {
    static final String ROOT = "root";
    private static final String FILE = "auto_lib.json";
    private static final int MAX_BYTES = 1_500_000;

    private AutoLib() { }

    static synchronized boolean save(Context ctx, String json) {
        if (json == null || json.length() > MAX_BYTES) return false;
        try {
            new JSONObject(json); // must be valid
            File tmp = new File(ctx.getFilesDir(), FILE + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(json.getBytes(StandardCharsets.UTF_8)); }
            return tmp.renameTo(new File(ctx.getFilesDir(), FILE));
        } catch (Exception e) { return false; }
    }

    static synchronized JSONObject load(Context ctx) {
        File f = new File(ctx.getFilesDir(), FILE);
        if (!f.isFile() || f.length() > MAX_BYTES) return new JSONObject();
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0, n;
            while (off < b.length && (n = in.read(b, off, b.length - off)) > 0) off += n;
            return new JSONObject(new String(b, 0, off, StandardCharsets.UTF_8));
        } catch (Exception e) { return new JSONObject(); }
    }

    static synchronized void clear(Context ctx) {
        new File(ctx.getFilesDir(), FILE).delete();
    }

    static List<MediaItem> children(Context ctx, String parent) {
        List<MediaItem> out = new ArrayList<>();
        Context lc = NowPlaying.localized(ctx, NowPlaying.appLang(ctx));
        JSONObject lib = load(ctx);
        if (ROOT.equals(parent)) {
            out.add(folder(ctx, "fav", lc.getString(R.string.auto_favorites), R.drawable.ic_auto_fav));
            out.add(folder(ctx, "pls", lc.getString(R.string.auto_playlists), R.drawable.ic_auto_pls));
            out.add(folder(ctx, "off", lc.getString(R.string.auto_offline), R.drawable.ic_auto_off));
            out.add(folder(ctx, "rec", lc.getString(R.string.auto_recent), R.drawable.ic_auto_rec));
            return out;
        }
        if ("pls".equals(parent)) {
            JSONArray pls = lib.optJSONArray("pls");
            for (int i = 0; pls != null && i < pls.length() && out.size() < 100; i++) {
                JSONObject p = pls.optJSONObject(i);
                if (p == null) continue;
                String id = p.optString("id", ""), name = p.optString("name", "");
                JSONArray tr = p.optJSONArray("tracks");
                if (id.isEmpty() || name.isEmpty() || tr == null || tr.length() == 0) continue;
                out.add(folder(ctx, "pl|" + id, name, R.drawable.ic_auto_pls));
            }
            return out;
        }
        JSONArray tracks = tracksOf(lib, parent);
        for (int i = 0; tracks != null && i < tracks.length() && out.size() < 200; i++) {
            JSONObject t = tracks.optJSONObject(i);
            if (t == null || t.optLong("id", 0) <= 0) continue;
            MediaDescriptionCompat d = new MediaDescriptionCompat.Builder()
                    .setMediaId("t|" + parent + "|" + t.optLong("id"))
                    .setTitle(t.optString("title", ""))
                    .setSubtitle(t.optString("artist", ""))
                    .build();
            out.add(new MediaItem(d, MediaItem.FLAG_PLAYABLE));
        }
        return out;
    }

    /** the songs of one list ("fav" "off" "rec" or "pl|<id>") exactly as the web snapshot has them */
    static JSONArray tracksOf(JSONObject lib, String list) {
        if ("fav".equals(list) || "off".equals(list) || "rec".equals(list)) return lib.optJSONArray(list);
        if (list != null && list.startsWith("pl|")) {
            JSONArray pls = lib.optJSONArray("pls");
            String id = list.substring(3);
            for (int i = 0; pls != null && i < pls.length(); i++) {
                JSONObject p = pls.optJSONObject(i);
                if (p != null && id.equals(p.optString("id"))) return p.optJSONArray("tracks");
            }
        }
        return null;
    }

    private static MediaItem folder(Context ctx, String id, String title, int icon) {
        Bundle extras = new Bundle();
        extras.putInt("android.media.browse.CONTENT_STYLE_BROWSABLE_HINT", 1); // list
        extras.putInt("android.media.browse.CONTENT_STYLE_PLAYABLE_HINT", 1);  // list
        MediaDescriptionCompat d = new MediaDescriptionCompat.Builder()
                .setMediaId(id).setTitle(title)
                .setIconUri(Uri.parse("android.resource://" + ctx.getPackageName() + "/drawable/" + ctx.getResources().getResourceEntryName(icon)))
                .setExtras(extras)
                .build();
        return new MediaItem(d, MediaItem.FLAG_BROWSABLE);
    }
}
