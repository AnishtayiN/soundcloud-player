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
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
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

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.lang.ref.WeakReference;

/**
 * Hosts the shared SoundCloud Player web UI (assets/www) inside a WebView and bridges it to
 * native features: Telegram login links, background playback + media notification, theming.
 */
public class MainActivity extends Activity {

    static final String HOST = "appassets.androidplatform.net";
    static final String START_URL = "https://" + HOST + "/assets/www/index.html";

    private static WeakReference<MainActivity> current = new WeakReference<>(null);

    private final Handler main = new Handler(Looper.getMainLooper());
    private FrameLayout root;
    private WebView web;
    private WebViewAssetLoader assets;
    private Updater updater;
    private volatile String pendingLink = "";
    private PermissionRequest pendingMic;           // 🎤 song recognition (getUserMedia)
    private ValueCallback<Uri[]> fileCallback;      // <input type="file">
    private static final int REQ_MIC = 8, REQ_FILE = 9;

    /** Run JavaScript in the current UI (used by PlaybackService for notification buttons). */
    static boolean js(final String code) {
        final MainActivity a = current.get();
        if (a == null || a.web == null) return false;
        a.main.post(() -> { if (a.web != null) a.web.evaluateJavascript(code, null); });
        return true;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        current = new WeakReference<>(this);

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
        if (updater != null) updater.onResume();
    }

    /** https://soundclouddl-player.netlify.app/t/123 | scplayer://t/123  →  "t_123";  …/p/<code> → "pl_<code>" */
    static String routeOf(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || intent.getData() == null) return "";
        Uri u = intent.getData();
        java.util.List<String> seg = new java.util.ArrayList<>(u.getPathSegments());
        if ("scplayer".equals(u.getScheme()) && u.getHost() != null) seg.add(0, u.getHost());
        if (seg.size() < 2) return "";
        String kind = seg.get(0), val = seg.get(1);
        if ("t".equals(kind) && val.matches("\\d{1,15}")) return "t_" + val;
        if ("p".equals(kind) && val.matches("[\\w-]{3,64}")) return "pl_" + val;
        return "";
    }

    /** Deliver an event to the web UI as window.postMessage(obj). */
    void postToWeb(final JSONObject o) {
        main.post(() -> { if (web != null) web.evaluateJavascript("window.postMessage(" + o.toString() + ",'*')", null); });
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
                    if (!wantsMic || !HOST.equals(request.getOrigin().getHost())) { request.deny(); return; }
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
                return assets.shouldInterceptRequest(request.getUrl());
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
                // renderer crashed or was killed — rebuild the WebView instead of crashing the app
                root.removeView(web);
                web.destroy();
                web = null;
                createWebView();
                web.loadUrl(START_URL);
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
        if (!isChangingConfigurations()) {
            PlaybackService.stop(this);
        }
        if (web != null) {
            root.removeView(web);
            web.destroy();
            web = null;
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
