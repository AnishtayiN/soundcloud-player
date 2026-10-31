package com.soundclouddl.player;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DEBUG ONLY (src/debug): lets the emulator tests run the real app UI "signed in" without a real account.
 * Requests of the app's API host and of the test media host https://media.test are forwarded to a mock server
 * on the test machine (adb reverse tcp:8787). Switched on with: am broadcast … DebugReceiver --es op mock_api --ez on true
 */
public class DebugMockApi implements MainActivity.MockApi {
    private static final String API_HOST = "fywphggwavthubehvvuh.supabase.co";
    private static final String BASE = "http://127.0.0.1:8787";

    @Override
    public WebResourceResponse intercept(WebResourceRequest r) {
        String host = r.getUrl().getHost(), path = r.getUrl().getEncodedPath();
        boolean api = API_HOST.equals(host) && path != null && path.startsWith("/functions/v1/scbot/api/");
        boolean media = "media.test".equals(host);
        if (!api && !media) return null;
        Map<String, String> cors = new HashMap<>();
        cors.put("Access-Control-Allow-Origin", "*");
        cors.put("Access-Control-Allow-Headers", "*");
        cors.put("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH, OPTIONS");
        cors.put("Access-Control-Expose-Headers", "content-length, content-range");
        String method = r.getMethod();
        if ("OPTIONS".equals(method)) return new WebResourceResponse("text/plain", "utf-8", 204, "No Content", cors, new ByteArrayInputStream(new byte[0]));
        try {
            String q = r.getUrl().getEncodedQuery();
            String target = BASE + (api ? "/api" + path.substring("/functions/v1/scbot/api".length()) : "/media" + path) + (q == null ? "" : "?" + q);
            HttpURLConnection c = (HttpURLConnection) new URL(target).openConnection();
            c.setRequestMethod("GET".equals(method) || "POST".equals(method) || "DELETE".equals(method) ? method : "GET");
            c.setRequestProperty("x-mock-method", method);
            for (Map.Entry<String, String> h : r.getRequestHeaders().entrySet()) {
                String k = h.getKey().toLowerCase();
                if (k.equals("range") || k.equals("x-app-token") || k.equals("content-type")) c.setRequestProperty(h.getKey(), h.getValue());
            }
            if ("POST".equals(method)) { c.setDoOutput(true); c.getOutputStream().write("{}".getBytes("UTF-8")); } // the WebView doesn't expose request bodies
            int code = c.getResponseCode();
            InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
            if (in == null) in = new ByteArrayInputStream(new byte[0]);
            Map<String, String> h = new HashMap<>(cors);
            for (Map.Entry<String, List<String>> e : c.getHeaderFields().entrySet())
                if (e.getKey() != null && e.getValue() != null && !e.getValue().isEmpty() && !e.getKey().toLowerCase().startsWith("access-control")) h.put(e.getKey(), e.getValue().get(0));
            String type = c.getContentType() == null ? "application/octet-stream" : c.getContentType().split(";")[0].trim();
            String reason = c.getResponseMessage() == null || c.getResponseMessage().isEmpty() ? "OK" : c.getResponseMessage();
            return new WebResourceResponse(type, "utf-8", code, reason, h, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 502, "Mock Down", cors, new ByteArrayInputStream(new byte[0]));
        }
    }
}
