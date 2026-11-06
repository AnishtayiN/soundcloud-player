package com.soundclouddl.player;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** DEBUG ONLY: receives the backup from the share sheet like any other app would and reports what it got. */
public class ShareCheckActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Intent i = getIntent();
        Uri u = i.getParcelableExtra(Intent.EXTRA_STREAM);
        StringBuilder r = new StringBuilder("share");
        r.append(" scheme=").append(u == null ? "null" : u.getScheme());
        r.append(" authority=").append(u == null ? "" : u.getAuthority());
        r.append(" read=").append((i.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0);
        r.append(" write=").append((i.getFlags() & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) != 0);
        r.append(" type=").append(i.getType());
        r.append(" uri=").append(u);
        try (InputStream in = getContentResolver().openInputStream(u); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            byte[] data = out.toByteArray();
            String s = new String(data, StandardCharsets.UTF_8);
            r.append(" bytes=").append(data.length).append(" format=").append(s.contains("\"soundcloud-player-backup\""));
            try (FileOutputStream f = new FileOutputStream(new File(getFilesDir(), "share_check.json"))) { f.write(data); }
        } catch (Exception e) { r.append(" error=").append(e); }
        Log.i("SCDBG", r.toString());
        finish();
    }
}
