package com.soundclouddl.player;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.session.MediaControllerCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.work.WorkInfo;
import androidx.work.WorkManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

/**
 * DEBUG ONLY test hooks (adb shell am broadcast -n com.soundclouddl.player/.DebugReceiver --es op …).
 * Results are logged with the tag SCDBG. They drive the REAL code paths (WorkManager jobs, the MediaBrowser
 * service, the share sheet); nothing here fakes a result for the release build.
 */
public class DebugReceiver extends BroadcastReceiver {
    private static final String T = "SCDBG";

    @Override
    public void onReceive(final Context ctx, Intent i) {
        String op = String.valueOf(i.getStringExtra("op"));
        Log.i(T, "op " + op);
        switch (op) {
            case "rel_now": Bg.runReleaseCheckNow(ctx); break;                 // the real ReleaseWorker via WorkManager
            case "sched_now": Bg.runSchedNow(ctx); break;                      // the real SchedWorker via WorkManager
            case "speech": ctx.getSharedPreferences("debug", Context.MODE_PRIVATE).edit().putString("speech", String.valueOf(i.getStringExtra("mode") == null ? "" : i.getStringExtra("mode"))).apply(); break;
            case "mock_api": ctx.getSharedPreferences("debug", Context.MODE_PRIVATE).edit().putBoolean("mock_api", i.getBooleanExtra("on", false)).commit(); Log.i(T, "mock_api " + i.getBooleanExtra("on", false)); break;
            case "close": Log.i(T, "close " + MainActivity.closeTask()); break;
            case "widget": PlayerWidget.updateAll(ctx); Log.i(T, "widget placed=" + PlayerWidget.hasWidgets(ctx) + " active=" + PlaybackService.isActive() + " playing=" + PlaybackService.isPlaying()); break;
            case "dump": dump(ctx, goAsync()); break;
            case "browse": browse(ctx, i.getStringExtra("play"), i.getStringExtra("ctl"), goAsync()); break;
            default: Log.i(T, "unknown op");
        }
    }

    private static void dump(final Context ctx, final PendingResult pr) {
        new Thread(() -> {
            try {
                JSONObject o = new JSONObject();
                JSONObject rel = Bg.json(ctx, "rel"); rel.put("token", rel.optString("token").isEmpty() ? "" : "<set>");
                JSONObject sch = Bg.json(ctx, "sched"); sch.put("token", sch.optString("token").isEmpty() ? "" : "<set>");
                o.put("rel", rel).put("sched", sch).put("relLast", ReleaseWorker.lastResult)
                        .put("schedNext", Bg.prefs(ctx).getLong("sched_next", 0)).put("schedLast", Bg.prefs(ctx).getString("sched_last", ""))
                        .put("waiting", Bg.dirCount(ctx)).put("bgdlBytes", Bg.dirBytes(Bg.dlDir(ctx)));
                JSONArray parts = new JSONArray();
                java.io.File[] kids = Bg.dlDir(ctx).listFiles();
                if (kids != null) for (java.io.File k : kids) parts.put(k.getName());
                o.put("bgdl", parts);
                JSONObject works = new JSONObject();
                for (String w : new String[]{Bg.W_REL, Bg.W_REL + "-now", Bg.W_SCHED, Bg.W_SCHED_NOW}) {
                    List<WorkInfo> l = WorkManager.getInstance(ctx).getWorkInfosForUniqueWork(w).get();
                    JSONArray a = new JSONArray();
                    for (WorkInfo x : l) a.put(x.getState().name());
                    works.put(w, a);
                }
                o.put("work", works);
                NowPlaying np = NowPlaying.read(ctx);
                o.put("np", new JSONObject().put("id", np.id).put("title", np.title).put("playing", np.playing).put("lang", np.lang));
                o.put("widgets", PlayerWidget.hasWidgets(ctx)).put("svcActive", PlaybackService.isActive()).put("appAlive", MainActivity.alive());
                Log.i(T, "dump " + o);
            } catch (Exception e) { Log.i(T, "dump error " + e); }
            pr.finish();
        }).start();
    }

    /** connects to our own MediaBrowserService exactly like Android Auto does, lists the tree, optionally plays */
    private static void browse(final Context ctx, final String play, final String ctl, final PendingResult pr) {
        final Handler h = new Handler(Looper.getMainLooper());
        final MediaBrowserCompat[] mb = new MediaBrowserCompat[1];
        final JSONObject out = new JSONObject();
        final Runnable done = () -> {
            try { if (mb[0] != null) mb[0].disconnect(); } catch (Exception ignored) { }
            Log.i(T, "browse " + out);
            pr.finish();
        };
        h.postDelayed(done, 9000);
        mb[0] = new MediaBrowserCompat(ctx, new ComponentName(ctx, PlaybackService.class), new MediaBrowserCompat.ConnectionCallback() {
            @Override public void onConnected() {
                try {
                    final String root = mb[0].getRoot();
                    out.put("root", root);
                    final MediaControllerCompat mc = new MediaControllerCompat(ctx, mb[0].getSessionToken());
                    final String[] folders = {root, "fav", "pls", "off", "rec"};
                    final int[] left = {folders.length};
                    for (final String f : folders) {
                        mb[0].subscribe(f, new MediaBrowserCompat.SubscriptionCallback() {
                            @Override public void onChildrenLoaded(String parentId, List<MediaBrowserCompat.MediaItem> children) {
                                try {
                                    JSONArray a = new JSONArray();
                                    for (MediaBrowserCompat.MediaItem it : children)
                                        a.put(new JSONObject().put("id", it.getMediaId()).put("title", String.valueOf(it.getDescription().getTitle()))
                                                .put("playable", it.isPlayable()).put("browsable", it.isBrowsable()));
                                    out.put(parentId, a);
                                } catch (Exception ignored) { }
                                mb[0].unsubscribe(parentId);
                                if (--left[0] == 0) after(mc);
                            }
                        });
                    }
                } catch (Exception e) { try { out.put("error", e.toString()); } catch (Exception ignored) { } }
            }

            private void after(final MediaControllerCompat mc) {
                try {
                    MediaControllerCompat.TransportControls tc = mc.getTransportControls();
                    if (play != null) tc.playFromMediaId(play, null);
                    if ("pause".equals(ctl)) tc.pause();
                    else if ("play".equals(ctl)) tc.play();
                    else if ("next".equals(ctl)) tc.skipToNext();
                    else if ("prev".equals(ctl)) tc.skipToPrevious();
                    else if (ctl != null && ctl.startsWith("q")) tc.skipToQueueItem(Long.parseLong(ctl.substring(1)));
                } catch (Exception e) { try { out.put("ctlError", e.toString()); } catch (Exception ignored) { } }
                h.postDelayed(() -> {
                    try {
                        PlaybackStateCompat st = mc.getPlaybackState();
                        out.put("state", st == null ? -1 : st.getState());
                        out.put("error", st == null || st.getErrorMessage() == null ? "" : st.getErrorMessage().toString());
                        out.put("title", mc.getMetadata() == null ? "" : String.valueOf(mc.getMetadata().getDescription().getTitle()));
                        out.put("queue", mc.getQueue() == null ? 0 : mc.getQueue().size());
                        out.put("activeQ", st == null ? -1 : st.getActiveQueueItemId());
                    } catch (Exception ignored) { }
                    h.removeCallbacks(done);
                    done.run();
                }, play != null || ctl != null ? 3500 : 300);
            }

            @Override public void onConnectionFailed() { try { out.put("error", "connection failed"); } catch (Exception ignored) { } }
        }, null);
        mb[0].connect();
    }
}
