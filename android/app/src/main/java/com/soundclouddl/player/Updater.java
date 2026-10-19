package com.soundclouddl.player;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * In-app updater: downloads the new APK (reporting 0‒100% progress to the web UI),
 * verifies it is our package, then hands it to the system installer.
 */
final class Updater {
    interface Sink { void post(JSONObject state); }

    private final Activity act;
    private final Sink sink;
    private volatile boolean cancel;
    private volatile Thread thread;
    private File ready;            // downloaded + verified APK
    private boolean waitingPerm;   // user sent to "install unknown apps" settings

    Updater(Activity a, Sink s) { act = a; sink = s; }

    synchronized void start(final String url, final String version) {
        if (thread != null && thread.isAlive()) return;
        if (url == null || !url.startsWith("https://github.com/")) { emit("error", 0, 0, "bad url"); return; }
        cancel = false;
        ready = null;
        thread = new Thread(() -> run(url, version), "sc-updater");
        thread.start();
    }

    void cancel() { cancel = true; }

    private void run(String url, String version) {
        File dir = new File(act.getCacheDir(), "updates");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
            f.delete();
        String safe = version == null ? "new" : version.replaceAll("[^0-9A-Za-z._-]", "");
        File part = new File(dir, "SoundCloud-Player-" + safe + ".part");
        File apk = new File(dir, "SoundCloud-Player-" + safe + ".apk");
        HttpURLConnection c = null;
        try {
            // follow redirects manually (github.com → objects.githubusercontent.com)
            String u = url;
            for (int i = 0; i < 6; i++) {
                c = (HttpURLConnection) new URL(u).openConnection();
                c.setInstanceFollowRedirects(false);
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "SoundCloudPlayer-Android");
                int code = c.getResponseCode();
                if (code >= 300 && code < 400) {
                    String loc = c.getHeaderField("Location");
                    c.disconnect();
                    if (loc == null) throw new Exception("redirect without location");
                    u = new URL(new URL(u), loc).toString();
                    continue;
                }
                if (code != 200) throw new Exception("HTTP " + code);
                break;
            }
            long total = c.getContentLengthLong();
            long got = 0, lastEmit = 0;
            emit("progress", 0, total, null);
            try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part)) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) {
                    if (cancel) throw new InterruptedException();
                    out.write(buf, 0, n);
                    got += n;
                    long now = System.currentTimeMillis();
                    if (now - lastEmit > 120) { lastEmit = now; emit("progress", got, total, null); }
                }
            }
            if (total > 0 && got != total) throw new Exception("incomplete download");
            if (!part.renameTo(apk)) throw new Exception("rename failed");

            PackageInfo pi = act.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), 0);
            if (pi == null || !act.getPackageName().equals(pi.packageName)) throw new Exception("invalid apk");

            emit("progress", got, got, null);
            synchronized (this) { ready = apk; }
            emit("done", got, got, null);
            act.runOnUiThread(this::install);
        } catch (InterruptedException e) {
            //noinspection ResultOfMethodCallIgnored
            part.delete();
            emit("canceled", 0, 0, null);
        } catch (Exception e) {
            //noinspection ResultOfMethodCallIgnored
            part.delete();
            emit("error", 0, 0, String.valueOf(e.getMessage()));
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /** Launch the system package installer (asks for "install unknown apps" first on Android 8+). */
    void install() {
        File apk;
        synchronized (this) { apk = ready; }
        if (apk == null || !apk.exists()) return;
        if (Build.VERSION.SDK_INT >= 26 && !act.getPackageManager().canRequestPackageInstalls()) {
            waitingPerm = true;
            emit("perm", apk.length(), apk.length(), null);
            try {
                act.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + act.getPackageName())));
            } catch (Exception e) {
                act.startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS));
            }
            return;
        }
        waitingPerm = false;
        Uri uri = FileProvider.getUriForFile(act, act.getPackageName() + ".files", apk);
        Intent i = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try { act.startActivity(i); } catch (Exception e) { emit("error", 0, 0, "no installer"); }
    }

    /** Called from Activity.onResume — continue automatically after the user granted the permission. */
    void onResume() {
        if (waitingPerm && (Build.VERSION.SDK_INT < 26 || act.getPackageManager().canRequestPackageInstalls())) install();
    }

    private void emit(String state, long received, long total, String msg) {
        try {
            JSONObject o = new JSONObject().put("__sc", "upd").put("state", state).put("received", received).put("total", total);
            if (msg != null) o.put("msg", msg);
            sink.post(o);
        } catch (Exception ignored) { }
    }
}
