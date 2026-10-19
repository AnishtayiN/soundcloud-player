package com.soundclouddl.player;

import android.content.Context;

/** Reads versionName from the package (avoids depending on generated BuildConfig). */
final class BuildConfigVersion {
    private static String cached;
    private BuildConfigVersion() { }
    static String name(Context c) {
        if (cached != null) return cached;
        try { cached = c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName; }
        catch (Exception e) { cached = "1.0.0"; }
        if (cached == null) cached = "1.0.0";
        return cached;
    }
}
