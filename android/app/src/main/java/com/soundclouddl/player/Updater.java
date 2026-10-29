package com.soundclouddl.player;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * In-app updater.
 *
 * <ol>
 *   <li>The download URL is never taken from the web UI: it is derived from the release version
 *       ({@code https://github.com/<repo>/releases/download/v<version>/SoundCloud-Player.apk}).</li>
 *   <li>The version must be strictly newer than the installed one.</li>
 *   <li>The APK must match the SHA-256 published in the release's {@code SHA256SUMS} file.</li>
 *   <li>The APK must be our package, carry exactly that versionName, a higher versionCode, and be signed with the
 *       same certificate as the installed app.</li>
 *   <li>Nothing is installed automatically: the UI shows "Install" and {@link #install()} runs only after the
 *       user taps it (the checksum is verified again right before the system installer is opened).</li>
 * </ol>
 * Progress / state is reported to the web UI as {@code {__sc:"upd", state, received, total, msg}}:
 * progress → verifying → done (ready, waiting for the user) | perm | error (msg "verify" = integrity check failed).
 */
final class Updater {
    interface Sink { void post(JSONObject state); }

    static final String REPO = "AnishtayiN/soundcloud-player";
    static final String APK_NAME = "SoundCloud-Player.apk";
    static final String SUMS_NAME = "SHA256SUMS";

    private final Activity act;
    private final Sink sink;
    private volatile boolean cancel;
    private volatile Thread thread;
    private File ready;            // downloaded + verified APK (waiting for the user to tap "Install")
    private String readySha;       // its SHA-256 (re-checked right before installing)
    private boolean waitingPerm;   // user tapped "Install" and was sent to the "install unknown apps" settings

    Updater(Activity a, Sink s) { act = a; sink = s; }

    /** @param url ignored except for logging — the URL is re-derived from {@code version} */
    synchronized void start(final String url, final String version) {
        if (thread != null && thread.isAlive()) return;
        final String v = version == null ? "" : version.trim().replaceFirst("^v", "");
        if (!v.matches("\\d{1,4}\\.\\d{1,2}\\.\\d{1,2}")) { emit("error", 0, 0, "bad version"); return; }
        if (compareVersions(v, BuildConfigVersion.name(act)) <= 0) { emit("error", 0, 0, "not newer"); return; }
        cancel = false;
        ready = null;
        readySha = null;
        thread = new Thread(() -> run(v), "sc-updater");
        thread.start();
    }

    void cancel() { cancel = true; }

    static int compareVersions(String a, String b) {
        String[] x = a.split("\\."), y = b.split("[.\\-+]");
        for (int i = 0; i < 3; i++) {
            int p = i < x.length ? parse(x[i]) : 0, q = i < y.length ? parse(y[i]) : 0;
            if (p != q) return p > q ? 1 : -1;
        }
        return 0;
    }
    private static int parse(String s) { try { return Integer.parseInt(s.replaceAll("\\D.*$", "")); } catch (Exception e) { return 0; } }

    private void run(String version) {
        File dir = new File(act.getCacheDir(), "updates");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) //noinspection ResultOfMethodCallIgnored
            f.delete();
        File part = new File(dir, APK_NAME + ".part");
        File apk = new File(dir, APK_NAME);   // fixed, expected file name
        String base = "https://github.com/" + REPO + "/releases/download/v" + version + "/";
        HttpURLConnection c = null;
        try {
            // 1) expected checksum from the release
            String expected = parseSum(new String(fetchSmall(base + SUMS_NAME), "UTF-8"), APK_NAME);
            if (expected == null) throw new VerifyException("no checksum for " + APK_NAME);

            // 2) download with progress
            c = open(base + APK_NAME);
            long total = c.getContentLengthLong();
            long got = 0, lastEmit = 0;
            emit("progress", 0, total, null);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(part)) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) {
                    if (cancel) throw new InterruptedException();
                    out.write(buf, 0, n);
                    md.update(buf, 0, n);
                    got += n;
                    if (got > 200L * 1024 * 1024) throw new VerifyException("too large");
                    long now = System.currentTimeMillis();
                    if (now - lastEmit > 120) { lastEmit = now; emit("progress", got, total, null); }
                }
            }
            if (total > 0 && got != total) throw new Exception("incomplete download");

            // 3) integrity
            emit("verifying", got, got, null);
            String actual = hex(md.digest());
            if (!actual.equalsIgnoreCase(expected)) throw new VerifyException("sha256 mismatch");
            if (!part.renameTo(apk)) throw new Exception("rename failed");

            // 4) identity: package, exact version, newer versionCode, same signing certificate
            verifyPackage(apk, version);

            synchronized (this) { ready = apk; readySha = actual; }
            emit("done", got, got, null); // wait for the user's explicit "Install"
        } catch (InterruptedException e) {
            cleanup(part, apk);
            emit("canceled", 0, 0, null);
        } catch (VerifyException e) {
            cleanup(part, apk);
            emit("error", 0, 0, "verify");
        } catch (Exception e) {
            cleanup(part, apk);
            emit("error", 0, 0, String.valueOf(e.getMessage()));
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private void verifyPackage(File apk, String version) throws Exception {
        PackageManager pm = act.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo pi = pm.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        PackageInfo me = pm.getPackageInfo(act.getPackageName(), flags);
        if (pi == null || !act.getPackageName().equals(pi.packageName)) throw new VerifyException("not our package");
        if (!version.equals(pi.versionName)) throw new VerifyException("version mismatch");
        if (code(pi) <= code(me)) throw new VerifyException("versionCode not newer");
        Set<String> a = certs(pi), b = certs(me);
        // the system installer also refuses an update signed with another key; when both sides are readable we
        // fail early with a clear message instead of a cryptic installer error
        if (!a.isEmpty() && !b.isEmpty() && !a.equals(b)) throw new VerifyException("signer mismatch");
    }

    @SuppressWarnings("deprecation")
    private static long code(PackageInfo p) { return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode; }

    @SuppressWarnings("deprecation")
    private static Set<String> certs(PackageInfo p) {
        Set<String> out = new HashSet<>();
        Signature[] sigs = null;
        if (Build.VERSION.SDK_INT >= 28 && p.signingInfo != null) {
            sigs = p.signingInfo.hasMultipleSigners() ? p.signingInfo.getApkContentsSigners() : p.signingInfo.getSigningCertificateHistory();
        } else if (p.signatures != null) {
            sigs = p.signatures;
        }
        if (sigs != null) for (Signature s : sigs) {
            try { out.add(hex(MessageDigest.getInstance("SHA-256").digest(s.toByteArray()))); } catch (Exception ignored) { }
        }
        return out;
    }

    /** "&lt;sha256&gt;  name" lines (sha256sum format, optional '*' binary marker) → hash for {@code name} */
    static String parseSum(String text, String name) {
        for (String line : text.split("\\r?\\n")) {
            String[] p = line.trim().split("\\s+", 2);
            if (p.length == 2 && p[0].matches("(?i)[0-9a-f]{64}") && p[1].replaceFirst("^\\*", "").equals(name)) return p[0].toLowerCase(Locale.ROOT);
        }
        return null;
    }

    /** follows redirects manually (github.com → objects.githubusercontent.com), https only */
    private static HttpURLConnection open(String url) throws Exception {
        String u = url;
        for (int i = 0; i < 6; i++) {
            if (!u.startsWith("https://")) throw new Exception("insecure redirect");
            HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
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
            if (code != 200) { c.disconnect(); throw new Exception("HTTP " + code); }
            return c;
        }
        throw new Exception("too many redirects");
    }

    private static byte[] fetchSmall(String url) throws Exception {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                if (out.size() > 64 * 1024) throw new VerifyException("checksum file too large");
            }
            return out.toByteArray();
        } finally { c.disconnect(); }
    }

    private static String sha256(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) md.update(buf, 0, n);
        }
        return hex(md.digest());
    }

    private static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder(b.length * 2);
        for (byte x : b) sb.append(String.format(Locale.ROOT, "%02x", x));
        return sb.toString();
    }

    private static void cleanup(File... files) {
        for (File f : files) //noinspection ResultOfMethodCallIgnored
            f.delete();
    }

    /** User tapped "Install": re-verify, then open the system package installer (asks for "install unknown apps" first on 8+). */
    void install() {
        File apk;
        String sha;
        synchronized (this) { apk = ready; sha = readySha; }
        if (apk == null || sha == null || !apk.exists()) return;
        try {
            if (!sha.equalsIgnoreCase(sha256(apk))) throw new VerifyException("changed on disk");
        } catch (Exception e) {
            synchronized (this) { ready = null; readySha = null; }
            cleanup(apk);
            emit("error", 0, 0, "verify");
            return;
        }
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

    /**
     * Activity.onResume: if the user had tapped "Install" and was sent to grant "install unknown apps", continue that
     * same user-initiated install once the permission is granted. Never starts an install on its own.
     */
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

    private static final class VerifyException extends Exception {
        private static final long serialVersionUID = 1L;
        VerifyException(String m) { super(m); }
    }
}
