package com.soundclouddl.player;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionService;
import android.speech.SpeechRecognizer;

import java.util.ArrayList;

/** DEBUG ONLY: plays the part of the OS recognizer so the bridge can be tested on an emulator without a microphone. */
public class DebugRecognitionService extends RecognitionService {
    private final Handler h = new Handler(Looper.getMainLooper());

    private static Bundle res(String t) {
        Bundle b = new Bundle();
        ArrayList<String> l = new ArrayList<>();
        l.add(t);
        b.putStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION, l);
        return b;
    }

    @Override
    protected void onStartListening(Intent intent, final Callback cb) {
        String mode = getSharedPreferences("debug", MODE_PRIVATE).getString("speech", "fake");
        String lang = intent.getStringExtra("android.speech.extra.LANGUAGE");
        android.util.Log.i("SCDBG", "speech start mode=" + mode + " lang=" + lang);
        try { cb.readyForSpeech(new Bundle()); } catch (Exception ignored) { }
        if ("fake_late".equals(mode)) { // a result that arrives long after the user closed the sheet
            h.postDelayed(() -> { try { cb.results(res("نتیجه‌ی دیررس")); } catch (Exception ignored) { } }, 4000);
            return;
        }
        if ("fake_err".equals(mode)) { h.postDelayed(() -> { try { cb.error(SpeechRecognizer.ERROR_NO_MATCH); } catch (Exception ignored) { } }, 400); return; }
        h.postDelayed(() -> { try { cb.partialResults(res("آهنگ")); } catch (Exception ignored) { } }, 400);
        h.postDelayed(() -> { try { cb.results(res("آهنگ شاد ایرانی")); } catch (Exception ignored) { } }, 1200);
    }

    @Override protected void onCancel(Callback cb) { android.util.Log.i("SCDBG", "speech cancel"); }
    @Override protected void onStopListening(Callback cb) { }
}
