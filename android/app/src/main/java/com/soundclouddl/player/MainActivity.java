package com.soundclouddl.player;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.StatFs;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.content.ClipData;
import android.content.ComponentName;
import android.graphics.Bitmap;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.ref.WeakReference;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

/**
 * Hosts the shared SoundCloud Player web UI (assets/www) inside a WebView and bridges it to
 * native features: Telegram login links, background playback + media notification, theming.
 */
public class MainActivity extends Activity {

    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    static final String START_URL = ORIGIN + "/assets/www/index.html";
    /** loaded after the renderer died: the web UI restores queue / track / position and resumes playback */
    static final String RECOVER_URL = START_URL + "#recover=1";

    private static WeakReference<MainActivity> current = new WeakReference<>(null);

    private final Handler main = new Handler(Looper.getMainLooper());
    private FrameLayout root;
    private WebView web;
    private WebViewAssetLoader assets;
    private Updater updater;
    private volatile String pendingLink = "";
    private PermissionRequest pendingMic;           // 🎤 song recognition (getUserMedia)
    private ValueCallback<Uri[]> fileCallback;      // <input type="file">
    private static final int REQ_MIC = 8, REQ_FILE = 9, REQ_SPEECH = 10;
    private static volatile boolean resumed;
    private volatile boolean ownPage;               // our own page (asset-loader origin) is loaded — checked by the bridge
    private SpeechRecognizer recognizer;            // 🎙 voice search (native recognizer)
    private int speechRun;                          // bumps on every start/stop → late results of an old session are ignored
    private String pendingSpeech;                   // language waiting for the microphone permission
    private ConnectivityManager.NetworkCallback netCb; // tells the page when Wi-Fi ↔ mobile data changes (auto-download of favorites)
    private volatile String netLast = "";

    /** Run JavaScript in the current UI (used by PlaybackService for notification buttons). */
    static boolean js(final String code) {
        final MainActivity a = current.get();
        if (a == null || a.web == null) return false;
        a.main.post(() -> { if (a.web != null) a.web.evaluateJavascript(code, null); });
        return true;
    }

    /** the player UI exists (WebView alive) — background jobs leave the work to the open app */
    static boolean alive() {
        MainActivity a = current.get();
        return a != null && a.web != null;
    }

    static boolean inForeground() { return resumed && alive(); }

    /** emulator tests only: the debug APK can answer the app's API calls from a local mock server (see src/debug/DebugMockApi).
     *  Release builds have no such class, no debug receiver to switch it on and are not debuggable — this stays null. */
    interface MockApi { WebResourceResponse intercept(WebResourceRequest r); }
    static volatile MockApi mockApi;
    private void loadMockApi() {
        if (!Bg.debuggable(this) || !getSharedPreferences("debug", MODE_PRIVATE).getBoolean("mock_api", false)) { mockApi = null; return; }
        try { mockApi = (MockApi) Class.forName(getPackageName() + ".DebugMockApi").getDeclaredConstructor().newInstance(); }
        catch (Exception e) { mockApi = null; }
    }

    /** closes the app like swiping it away from recents (used by the debug test receiver) */
    static boolean closeTask() {
        final MainActivity a = current.get();
        if (a == null) return false;
        a.main.post(a::finishAndRemoveTask);
        return true;
    }

    /** tell the open web UI that something happened in the background ({__sc: type}) */
    static void event(String type) {
        MainActivity a = current.get();
        if (a == null) return;
        try { a.postToWeb(new JSONObject().put("__sc", type)); } catch (Exception ignored) { }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        current = new WeakReference<>(this);
        loadMockApi();

        Window w = getWindow();
        WindowCompat.setDecorFitsSystemWindows(w, false);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 29) {
            w.setStatusBarContrastEnforced(false);
            w.setNavigationBarContrastEnforced(false);
        }

        root = new FrameLayout(this);
        root.setBackgroundColor(isNight() ? 0xFF0B0B10 : 0xFFF6F6FA);
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });

        updater = new Updater(this, this::postToWeb);
        watchNetwork();
        if (savedInstanceState == null) pendingLink = routeOf(getIntent());

        createWebView();
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        if (web.getUrl() == null) web.loadUrl(START_URL);

        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String r = routeOf(intent);
        if (!r.isEmpty()) {
            pendingLink = r;
            try { postToWeb(new JSONObject().put("__sc", "link")); } catch (Exception ignored) { }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        if (updater != null) updater.onResume();
    }

    @Override
    protected void onPause() {
        resumed = false;
        super.onPause();
    }

    @Override
    protected void onStop() {
        speechStop(); // the app went to the background → the microphone is never left open
        super.onStop();
    }

    /**
     * Current connection for "auto-download favorites only on Wi-Fi":
     * {"known":true,"ok":true,"type":"wifi"} — ok only on an unmetered Wi-Fi/Ethernet network
     * (a metered Wi-Fi such as a phone hotspot counts as mobile data → not ok).
     */
    String netInfoJson() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            if (cm == null) return "{\"known\":false}";
            Network n = cm.getActiveNetwork();
            NetworkCapabilities c = n == null ? null : cm.getNetworkCapabilities(n);
            if (c == null) return "{\"known\":true,\"ok\":false,\"type\":\"none\"}";
            String type = c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ? "wifi"
                    : c.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ? "ethernet"
                    : c.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ? "cellular"
                    : c.hasTransport(NetworkCapabilities.TRANSPORT_VPN) ? "vpn" : "other";
            boolean unmetered = !cm.isActiveNetworkMetered();
            boolean ok = unmetered && ("wifi".equals(type) || "ethernet".equals(type) || ("vpn".equals(type) && !c.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)));
            return new JSONObject().put("known", true).put("ok", ok).put("type", type).put("metered", !unmetered).toString();
        } catch (Exception e) {
            return "{\"known\":false}";
        }
    }

    private void watchNetwork() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            if (cm == null) return;
            netCb = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) { netChanged(); }
                @Override public void onLost(Network network) { netChanged(); }
                @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities caps) { netChanged(); }
            };
            cm.registerDefaultNetworkCallback(netCb); // API 24+ (= minSdk)
        } catch (Exception ignored) { netCb = null; }
    }

    private void netChanged() {
        String now = netInfoJson();
        if (now.equals(netLast)) return; // capabilities change often (signal strength) → only real changes
        netLast = now;
        main.postDelayed(() -> { try { postToWeb(new JSONObject().put("__sc", "net")); } catch (Exception ignored) { } }, 1200);
    }

    /** https://soundclouddl-player.netlify.app/t/123 | scplayer://t/123  →  "t_123";  …/p/<code> → "pl_<code>";  …/j/<code> → "j_<code>" */
    static String routeOf(Intent intent) {
        if (intent != null && PlayerWidget.A_OPEN_PLAYER.equals(intent.getAction())) return "np"; // widget / media notification → the player
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || intent.getData() == null) return "";
        Uri u = intent.getData();
        java.util.List<String> seg = new java.util.ArrayList<>(u.getPathSegments());
        if ("scplayer".equals(u.getScheme()) && u.getHost() != null) seg.add(0, u.getHost());
        if (seg.size() < 2) return "";
        String kind = seg.get(0), val = seg.get(1);
        if ("t".equals(kind) && val.matches("\\d{1,15}")) return "t_" + val;
        if ("p".equals(kind) && val.matches("[\\w-]{3,64}")) return "pl_" + val;
        if ("j".equals(kind) && val.matches("[2-9a-hjkmnp-z]{10}")) return "j_" + val; // listen-together invite
        if ("a".equals(kind) && val.matches("\\d{1,15}")) return "a_" + val;           // artist (release notification)
        return "";
    }

    /**
     * Deliver an event to the web UI as window.postMessage(obj, ORIGIN). The target origin is the asset loader's
     * origin, so the message is only delivered while our own page is loaded; web/app.js additionally checks
     * e.origin and e.source before handling it.
     */
    void postToWeb(final JSONObject o) {
        final String js = "window.postMessage(" + o.toString() + "," + JSONObject.quote(ORIGIN) + ")";
        main.post(() -> {
            if (web == null) return;
            String url = web.getUrl();
            if (url == null || !url.startsWith(ORIGIN + "/")) return; // never hand native events to a foreign page
            web.evaluateJavascript(js, null);
        });
    }

    private boolean isNight() {
        return (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)
                == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void createWebView() {
        assets = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                // songs downloaded by the background scheduler, read once by the app and moved into its offline library
                .addPathHandler("/bgdl/", new WebViewAssetLoader.InternalStoragePathHandler(this, Bg.dlDir(this)))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " SCPlayerAndroid/" + BuildConfigVersion.name(this));
        if (Build.VERSION.SDK_INT >= 26) {
            // keep the renderer alive while the app is in the background (music keeps playing)
            web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        web.addJavascriptInterface(new Bridge(), "SCAndroid");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                main.post(() -> {
                    boolean wantsMic = false;
                    for (String r : request.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) wantsMic = true;
                    Uri origin = request.getOrigin();
                    if (!wantsMic || origin == null || !"https".equals(origin.getScheme()) || !HOST.equals(origin.getHost())) { request.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        if (pendingMic != null) pendingMic.deny();
                        pendingMic = request;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"audio/*", "video/*"});
                try {
                    startActivityForResult(Intent.createChooser(i, null), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                MockApi m = mockApi;
                if (m != null) { WebResourceResponse r = m.intercept(request); if (r != null) return r; }
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                ownPage = url != null && url.startsWith(ORIGIN + "/");
                if (!ownPage) speechStop();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                // renderer crashed or was killed — rebuild the WebView instead of crashing the app.
                // The UI persists queue / current track / position in localStorage and resumes them on #recover=1.
                if (web != null) {
                    root.removeView(web);
                    web.destroy();
                    web = null;
                }
                createWebView();
                web.loadUrl(RECOVER_URL);
                return true;
            }
        });
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    void openExternal(String url) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://") || url.startsWith("tg:"))) return;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            // tg:// without Telegram installed → fall back to t.me in the browser
            if (url.startsWith("tg:")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                } catch (Exception ignored) { }
            }
        }
    }

    // ───────────── 🎙 native voice search (SpeechRecognizer) ─────────────

    /** debug builds only: a test recognizer / "no recognizer" switch set over adb (see src/debug) */
    private String debugSpeech() {
        if (!Bg.debuggable(this)) return "";
        return getSharedPreferences("debug", MODE_PRIVATE).getString("speech", "");
    }

    private boolean recognizerAvailable() {
        String d = debugSpeech();
        if ("none".equals(d)) return false;
        if (d.startsWith("fake")) return true;
        return SpeechRecognizer.isRecognitionAvailable(this);
    }

    private void speechEvent(String type, String text, String code) {
        try {
            JSONObject o = new JSONObject().put("__sc", "speech").put("type", type);
            if (text != null) o.put("text", text);
            if (code != null) o.put("code", code);
            postToWeb(o);
        } catch (Exception ignored) { }
    }

    /** main thread */
    private void speechStart(String lang) {
        if (!ownPage || web == null) return; // only our own page may open the microphone
        speechStop();
        final String l = "en-US".equals(lang) ? "en-US" : "fa-IR";
        if (!recognizerAvailable()) { speechEvent("error", null, "na"); return; }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingSpeech = l; // same permission flow as song recognition
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_SPEECH);
            return;
        }
        speechBegin(l);
    }

    private void speechBegin(final String lang) {
        final int run = ++speechRun;
        try {
            String d = debugSpeech();
            recognizer = d.startsWith("fake")
                    ? SpeechRecognizer.createSpeechRecognizer(this, new ComponentName(getPackageName(), getPackageName() + ".DebugRecognitionService"))
                    : SpeechRecognizer.createSpeechRecognizer(this);
        } catch (Exception e) { speechEvent("error", null, "na"); return; }
        recognizer.setRecognitionListener(new RecognitionListener() {
            private boolean live() { return run == speechRun; }
            private String first(Bundle b) {
                ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                return r == null || r.isEmpty() || r.get(0) == null ? "" : r.get(0).trim();
            }
            @Override public void onReadyForSpeech(Bundle params) { if (live()) speechEvent("ready", null, null); }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onPartialResults(Bundle b) { if (!live()) return; String t = first(b); if (!t.isEmpty()) speechEvent("partial", t, null); }
            @Override public void onEvent(int eventType, Bundle params) { }
            @Override public void onResults(Bundle b) {
                if (!live()) return; // late result of a stopped session → ignored
                String t = first(b);
                if (t.isEmpty()) speechEvent("error", null, "nomatch"); else speechEvent("final", t, null);
                speechStop();
            }
            @Override public void onError(int error) {
                if (!live()) return;
                String code;
                switch (error) {
                    case SpeechRecognizer.ERROR_NO_MATCH: case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: code = "nomatch"; break;
                    case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: code = "perm"; break;
                    case SpeechRecognizer.ERROR_NETWORK: case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: case SpeechRecognizer.ERROR_SERVER: case 11: code = "net"; break;
                    case 12: case 13: code = "nalang"; break; // ERROR_LANGUAGE_NOT_SUPPORTED / ERROR_LANGUAGE_UNAVAILABLE (API 31+)
                    default: code = "err";
                }
                speechEvent("error", null, code);
                speechStop();
            }
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)
                .putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, true)
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                .putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        try { recognizer.startListening(i); } catch (Exception e) { speechEvent("error", null, "err"); speechStop(); }
    }

    /** closes the microphone; any result that still arrives from this session is ignored */
    void speechStop() {
        speechRun++;
        pendingSpeech = null;
        SpeechRecognizer r = recognizer;
        recognizer = null;
        if (r != null) {
            try { r.cancel(); } catch (Exception ignored) { }
            try { r.destroy(); } catch (Exception ignored) { }
        }
    }

    // ───────────── backup share (ACTION_SEND + FileProvider) ─────────────

    /** @return "ok" | "secret" (refused: contains a login token) | "err" */
    String shareFile(String name, String mime, String text) {
        if (!ownPage || name == null || text == null || !name.matches("[\\w.-]{1,80}\\.json") || text.length() > 8 * 1048576) return "err";
        if (!"application/json".equals(mime)) return "err";
        String token = Bg.json(this, "rel").optString("token", "");
        if (text.contains("\"sc_token\"") || text.contains("x-app-token") || text.contains("x-init-data") || (token.length() >= 16 && text.contains(token))) return "secret";
        try {
            File dir = new File(getCacheDir(), "share");
            Bg.deleteTree(dir); // only the newest backup is ever shareable
            if (!dir.mkdirs()) return "err";
            File f = new File(dir, name);
            try (FileOutputStream out = new FileOutputStream(f)) { out.write(text.getBytes(StandardCharsets.UTF_8)); }
            final Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".files", f); // content://, never file://
            final Intent send = new Intent(Intent.ACTION_SEND).setType("application/json")
                    .putExtra(Intent.EXTRA_STREAM, uri)
                    .putExtra(Intent.EXTRA_SUBJECT, name)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); // temporary, read-only
            send.setClipData(ClipData.newUri(getContentResolver(), name, uri));
            final String title = NowPlaying.localized(this, NowPlaying.appLang(this)).getString(R.string.share_backup);
            main.post(() -> {
                try {
                    Intent chooser = Intent.createChooser(send, title);
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(chooser);
                } catch (Exception ignored) { }
            });
            return "ok";
        } catch (Exception e) { return "err"; }
    }

    String storageInfoJson() {
        try {
            // the volume that holds the WebView's IndexedDB (offline songs) = the app's internal data volume
            StatFs st = new StatFs(getFilesDir().getPath());
            return new JSONObject().put("free", st.getAvailableBytes()).put("total", st.getTotalBytes()).put("exact", true).toString();
        } catch (Exception e) { return "{\"exact\":false}"; }
    }

    String batteryJson() {
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            boolean ign = pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
            return new JSONObject().put("ignoring", ign).put("maker", String.valueOf(Build.MANUFACTURER).toLowerCase()).toString();
        } catch (Exception e) { return "{}"; }
    }

    void openBatterySettings() {
        // the system list "battery optimization" — the user decides; no special permission is requested
        Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        try { startActivity(i); }
        catch (Exception e) {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) { }
        }
    }

    /** JavaScript bridge exposed as window.SCAndroid (adapted to window.SCNative in index.html). */
    private class Bridge {
        @JavascriptInterface public String version() { return BuildConfigVersion.name(MainActivity.this); }

        @JavascriptInterface public String device() {
            String m = Build.MODEL == null ? "" : Build.MODEL;
            String b = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER;
            String name = m.toLowerCase().startsWith(b.toLowerCase()) ? m : (b + " " + m);
            return ("Android " + Build.VERSION.RELEASE + " · " + name.trim());
        }

        @JavascriptInterface public void openExternal(final String url) { main.post(() -> MainActivity.this.openExternal(url)); }

        @JavascriptInterface public String netInfo() { return netInfoJson(); }

        @JavascriptInterface public String takeLink() { String l = pendingLink; pendingLink = ""; return l == null ? "" : l; }

        @JavascriptInterface public void share(final String text, final String url) {
            main.post(() -> {
                Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain")
                        .putExtra(Intent.EXTRA_SUBJECT, text)
                        .putExtra(Intent.EXTRA_TEXT, (text == null || text.isEmpty() ? "" : text + "\n") + url);
                try { startActivity(Intent.createChooser(send, null)); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface public void copy(final String text) {
            main.post(() -> {
                android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(android.content.ClipData.newPlainText("link", text));
            });
        }

        @JavascriptInterface public void downloadUpdate(final String url, final String version) { updater.start(url, version); }
        @JavascriptInterface public void cancelUpdate() { updater.cancel(); }
        @JavascriptInterface public void installUpdate() { main.post(() -> updater.install()); }

        @JavascriptInterface public void mediaState(final String json) {
            main.post(() -> {
                try { PlaybackService.onState(MainActivity.this, new JSONObject(json)); } catch (Exception ignored) { }
            });
        }

        // 🎙 voice search
        @JavascriptInterface public void speechStart(final String lang) { main.post(() -> MainActivity.this.speechStart(lang)); }
        @JavascriptInterface public void speechStop() { main.post(MainActivity.this::speechStop); }

        // 💾 backup share sheet
        @JavascriptInterface public String shareFile(String name, String mime, String text) { return MainActivity.this.shareFile(name, mime, text); }

        // 🔔 notifications + background release check
        @JavascriptInterface public boolean notify(String json) {
            if (!ownPage) return false;
            try {
                JSONObject o = new JSONObject(json);
                return Bg.notice(MainActivity.this, o.optInt("id", 3000), o.optString("title", ""), o.optString("body", ""), o.optString("link", ""));
            } catch (Exception e) { return false; }
        }
        @JavascriptInterface public void bgSync(String json) { if (ownPage) Bg.syncReleases(MainActivity.this, json); }
        @JavascriptInterface public String bgSeen() { return ownPage ? ReleaseWorker.take(MainActivity.this) : "{}"; }

        // ⏰ scheduled downloads
        @JavascriptInterface public void schedSet(String json) { if (ownPage) Bg.syncSched(MainActivity.this, json); }
        @JavascriptInterface public String schedTake() { return ownPage ? SchedWorker.take(MainActivity.this) : "{}"; }
        @JavascriptInterface public void schedAck(String id) { try { if (ownPage) SchedWorker.ack(MainActivity.this, Long.parseLong(id)); } catch (Exception ignored) { } }

        // 💽 exact free space + battery-optimization status
        @JavascriptInterface public String storageInfo() { return storageInfoJson(); }
        @JavascriptInterface public String batteryInfo() { return batteryJson(); }
        @JavascriptInterface public void openBatterySettings() { main.post(MainActivity.this::openBatterySettings); }

        // 🚗 Android Auto library snapshot + 🏠 widget
        @JavascriptInterface public boolean autoLib(String json) {
            if (!ownPage || !AutoLib.save(MainActivity.this, json)) return false;
            try {
                String l = new JSONObject(json).optString("lang", "");
                if (!l.equals(NowPlaying.appLang(MainActivity.this))) { NowPlaying.setLang(MainActivity.this, l); PlayerWidget.updateAll(MainActivity.this); }
            } catch (Exception ignored) { }
            PlaybackService.libraryChanged();
            return true;
        }
        @JavascriptInterface public String widgetInfo() {
            try { return new JSONObject().put("pin", PlayerWidget.pinSupported(MainActivity.this)).put("placed", PlayerWidget.hasWidgets(MainActivity.this)).toString(); }
            catch (Exception e) { return "{}"; }
        }
        @JavascriptInterface public void widgetPin() { main.post(() -> PlayerWidget.requestPin(MainActivity.this)); }

        @JavascriptInterface public void setTheme(final String bg, final boolean light) {
            main.post(() -> {
                try {
                    int c = Color.parseColor(bg);
                    root.setBackgroundColor(c);
                    getWindow().getDecorView().setBackgroundColor(c);
                    WindowInsetsControllerCompat ctl = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                    ctl.setAppearanceLightStatusBars(light);
                    ctl.setAppearanceLightNavigationBars(light);
                } catch (Exception ignored) { }
            });
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web == null) { moveTaskToBack(true); return; }
        web.evaluateJavascript("(function(){try{return !!(window.__scBack&&window.__scBack())}catch(e){return false}})()", value -> {
            if (!"true".equals(value)) moveTaskToBack(true); // keep playing in background instead of closing
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    // NOTE: we intentionally do NOT call web.onPause()/pauseTimers() so audio continues in background.

    @Override
    protected void onDestroy() {
        speechStop();
        if (!isChangingConfigurations()) {
            PlaybackService.stop(this);
        }
        if (web != null) {
            root.removeView(web);
            web.destroy();
            web = null;
        }
        if (netCb != null) {
            try { ((ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCb); } catch (Exception ignored) { }
            netCb = null;
        }
        if (current.get() == this) current = new WeakReference<>(null);
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_MIC && pendingMic != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                pendingMic.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                pendingMic.deny();
            }
            pendingMic = null;
        }
        if (requestCode == REQ_SPEECH && pendingSpeech != null) {
            String l = pendingSpeech;
            pendingSpeech = null;
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) speechBegin(l);
            else speechEvent("error", null, "perm"); // denied → a clear message, never fake text
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }
}
