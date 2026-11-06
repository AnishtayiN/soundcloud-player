package com.soundclouddl.player;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * Home-screen "now playing" widget. It has no player of its own: it shows the state PlaybackService (the
 * MediaSession of the web player) reports, and its buttons send the same sc.* actions as the media notification.
 * When the service isn't running (app closed, phone rebooted) it shows the last song as stopped — never
 * "playing" — and every tap opens the app.
 */
public class PlayerWidget extends AppWidgetProvider {

    static final String A_OPEN_PLAYER = "com.soundclouddl.player.OPEN_PLAYER";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        render(ctx, mgr, ids);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, android.os.Bundle opts) {
        render(ctx, mgr, new int[]{id});
    }

    static void updateAll(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            if (mgr == null) return;
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, PlayerWidget.class));
            if (ids != null && ids.length > 0) render(ctx, mgr, ids);
        } catch (Exception ignored) { }
    }

    static boolean hasWidgets(Context ctx) {
        try {
            int[] ids = AppWidgetManager.getInstance(ctx).getAppWidgetIds(new ComponentName(ctx, PlayerWidget.class));
            return ids != null && ids.length > 0;
        } catch (Exception e) { return false; }
    }

    private static void render(Context ctx, AppWidgetManager mgr, int[] ids) {
        NowPlaying np = NowPlaying.read(ctx);
        boolean live = PlaybackService.isActive();           // the media service is really running right now
        boolean playing = live && PlaybackService.isPlaying();
        Context lc = NowPlaying.localized(ctx, np.lang);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), "en".equals(np.lang) ? R.layout.widget_player_ltr : R.layout.widget_player);

        boolean has = np.id > 0 && !np.title.isEmpty();
        v.setTextViewText(R.id.w_title, has ? np.title : lc.getString(R.string.widget_empty));
        v.setTextViewText(R.id.w_artist, has ? np.artist : lc.getString(R.string.app_name));
        v.setTextViewText(R.id.w_status, !has ? "" : playing ? lc.getString(R.string.widget_playing)
                : live ? lc.getString(R.string.widget_paused) : lc.getString(R.string.widget_stopped));
        Bitmap art = has ? np.art(ctx) : null;
        if (art != null) v.setImageViewBitmap(R.id.w_art, art); else v.setImageViewResource(R.id.w_art, R.mipmap.ic_launcher);
        v.setImageViewResource(R.id.w_play, playing ? R.drawable.ic_pause : R.drawable.ic_play);
        v.setContentDescription(R.id.w_play, lc.getString(playing ? R.string.pause : R.string.play));
        v.setContentDescription(R.id.w_prev, lc.getString(R.string.prev));
        v.setContentDescription(R.id.w_next, lc.getString(R.string.next));
        v.setContentDescription(R.id.w_art, lc.getString(R.string.widget_open));

        PendingIntent open = openApp(ctx);
        v.setOnClickPendingIntent(R.id.w_root, open);
        v.setOnClickPendingIntent(R.id.w_art, open);
        if (live) {
            v.setOnClickPendingIntent(R.id.w_play, service(ctx, PlaybackService.A_TOGGLE, 21));
            v.setOnClickPendingIntent(R.id.w_prev, service(ctx, PlaybackService.A_PREV, 22));
            v.setOnClickPendingIntent(R.id.w_next, service(ctx, PlaybackService.A_NEXT, 23));
        } else { // nothing is playing anywhere → the buttons can't control anything; they open the app instead
            v.setOnClickPendingIntent(R.id.w_play, open);
            v.setOnClickPendingIntent(R.id.w_prev, open);
            v.setOnClickPendingIntent(R.id.w_next, open);
        }
        for (int id : ids) {
            try { mgr.updateAppWidget(id, v); } catch (Exception ignored) { }
        }
    }

    static PendingIntent openApp(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class).setAction(A_OPEN_PLAYER)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, 20, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static PendingIntent service(Context ctx, String action, int req) {
        Intent i = new Intent(ctx, PlaybackService.class).setAction(action).putExtra("from", "widget");
        int f = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        // a widget tap may start the (foreground) media service; onStartCommand always calls startForeground()
        return Build.VERSION.SDK_INT >= 26 ? PendingIntent.getForegroundService(ctx, req, i, f) : PendingIntent.getService(ctx, req, i, f);
    }

    /** Android 8+: ask the launcher to place the widget (the user confirms in a system dialog). */
    static boolean requestPin(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return false;
        try {
            AppWidgetManager mgr = ctx.getSystemService(AppWidgetManager.class);
            if (mgr == null || !mgr.isRequestPinAppWidgetSupported()) return false;
            return mgr.requestPinAppWidget(new ComponentName(ctx, PlayerWidget.class), null, null);
        } catch (Exception e) { return false; }
    }

    static boolean pinSupported(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return false;
        try {
            AppWidgetManager mgr = ctx.getSystemService(AppWidgetManager.class);
            return mgr != null && mgr.isRequestPinAppWidgetSupported();
        } catch (Exception e) { return false; }
    }
}
