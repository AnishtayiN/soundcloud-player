package com.soundclouddl.player;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import androidx.core.app.NotificationManagerCompat;
import androidx.work.WorkManager;

import org.json.JSONArray;
import org.json.JSONObject;

/** "Cancel" on the scheduled-download notification: stops the job, deletes the partial file, clears the queue. */
public class SchedCancelReceiver extends BroadcastReceiver {
    static final String ACTION = "com.soundclouddl.player.SCHED_CANCEL";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (!ACTION.equals(intent.getAction())) return;
        WorkManager wm = WorkManager.getInstance(ctx);
        wm.cancelUniqueWork(Bg.W_SCHED);
        wm.cancelUniqueWork(Bg.W_SCHED_NOW);
        JSONObject cfg = Bg.json(ctx, "sched");
        try { cfg.put("items", new JSONArray()).put("canceled", true); } catch (Exception ignored) { }
        Bg.put(ctx, "sched", cfg);
        Bg.cleanPartials(ctx);
        NotificationManagerCompat.from(ctx).cancel(SchedWorker.NOTIF_ID);
        try { Toast.makeText(ctx, NowPlaying.localized(ctx, NowPlaying.appLang(ctx)).getString(R.string.dl_canceled), Toast.LENGTH_SHORT).show(); } catch (Exception ignored) { }
        MainActivity.event("sched");
    }
}
