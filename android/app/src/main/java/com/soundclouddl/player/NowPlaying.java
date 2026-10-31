package com.soundclouddl.player;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;

/**
 * The last real playback state reported by the web player (via PlaybackService), persisted so the home-screen
 * widget and Android Auto can show the last song after the app was closed or the phone rebooted.
 * Nothing here is invented: it is exactly the last state the player pushed; "playing" is only shown while
 * PlaybackService is actually alive (see {@link PlaybackService#isActive()}).
 */
final class NowPlaying {
    private static final String PREFS = "now_playing";
    private static final String ART_FILE = "np_art.jpg";
    private static final int WIDGET_ART_PX = 192;

    long id;
    String title = "", artist = "", artwork = "", artFor = "", lang = "fa";
    boolean playing;

    private NowPlaying() { }

    static NowPlaying read(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        NowPlaying n = new NowPlaying();
        n.id = p.getLong("id", 0);
        n.title = p.getString("title", "");
        n.artist = p.getString("artist", "");
        n.artwork = p.getString("artwork", "");
        n.artFor = p.getString("art_for", "");
        n.playing = p.getBoolean("playing", false);
        n.lang = p.getString("lang", "fa");
        return n;
    }

    /** @return true when something the widget shows has changed (track, play/pause, language) */
    static boolean save(Context ctx, JSONObject s) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor e = p.edit();
        boolean changed = false;
        String lang = s.optString("lang", "");
        if (("fa".equals(lang) || "en".equals(lang)) && !lang.equals(p.getString("lang", "fa"))) { e.putString("lang", lang); changed = true; }
        if (s.optBoolean("stop")) {
            if (p.getBoolean("playing", false)) { e.putBoolean("playing", false); changed = true; }
            e.apply();
            return changed;
        }
        long id = s.optLong("id", 0);
        if (id > 0) {
            String title = s.optString("title", ""), artist = s.optString("artist", ""), art = s.optString("artwork", "");
            boolean playing = s.optBoolean("playing") || s.optBoolean("loading");
            if (id != p.getLong("id", 0) || !title.equals(p.getString("title", "")) || playing != p.getBoolean("playing", false)
                    || !artist.equals(p.getString("artist", ""))) changed = true;
            e.putLong("id", id).putString("title", title).putString("artist", artist).putString("artwork", art)
                    .putBoolean("playing", playing).putLong("at", System.currentTimeMillis());
        }
        e.apply();
        return changed;
    }

    static void setLang(Context ctx, String lang) {
        if (!"fa".equals(lang) && !"en".equals(lang)) return;
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("lang", lang).apply();
    }

    static void setPlaying(Context ctx, boolean playing) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("playing", playing).apply();
    }

    /** Small copy of the real cover for the widget (survives a reboot). Called off the main thread. */
    static void saveArt(Context ctx, Bitmap bmp, String url) {
        if (bmp == null || url == null || url.isEmpty()) return;
        try {
            float k = (float) WIDGET_ART_PX / Math.max(bmp.getWidth(), bmp.getHeight());
            Bitmap small = k < 1f ? Bitmap.createScaledBitmap(bmp, Math.max(1, Math.round(bmp.getWidth() * k)), Math.max(1, Math.round(bmp.getHeight() * k)), true) : bmp;
            File tmp = new File(ctx.getFilesDir(), ART_FILE + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) { small.compress(Bitmap.CompressFormat.JPEG, 88, out); }
            if (small != bmp) small.recycle();
            File dst = new File(ctx.getFilesDir(), ART_FILE);
            if (!tmp.renameTo(dst)) { tmp.delete(); return; }
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("art_for", url).apply();
        } catch (Exception | OutOfMemoryError ignored) { }
    }

    /** the saved cover, only if it belongs to the saved track (never a previous song's cover) */
    Bitmap art(Context ctx) {
        if (artwork.isEmpty() || !artwork.equals(artFor)) return null;
        File f = new File(ctx.getFilesDir(), ART_FILE);
        if (!f.isFile()) return null;
        try { return BitmapFactory.decodeFile(f.getPath()); } catch (Exception | OutOfMemoryError e) { return null; }
    }

    /** Resources in the app's own language (the app is Persian-first, independent of the system language). */
    static Context localized(Context ctx, String lang) {
        Configuration c = new Configuration(ctx.getResources().getConfiguration());
        Locale l = "en".equals(lang) ? Locale.ENGLISH : new Locale("fa");
        c.setLocale(l);
        c.setLayoutDirection(l);
        return ctx.createConfigurationContext(c);
    }

    static String appLang(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("lang", "fa");
    }
}
