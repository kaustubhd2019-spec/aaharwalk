package com.aaharwalk.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * The one thing the web app genuinely cannot do on its own: all-day step counting.
 *
 * Android's TYPE_STEP_COUNTER is maintained by the hardware, so it keeps counting
 * while the screen is off and the app is closed. It reports steps since the device
 * last booted, so this class keeps a per-day baseline and reports today's total.
 *
 * Exposed to JavaScript as `window.AndroidSteps`.
 */
public class StepBridge implements SensorEventListener {

    private static final String PREFS = "aaharwalk_steps";
    private static final String KEY_DATE = "baseline_date";
    private static final String KEY_RAW = "baseline_raw";
    private static final String KEY_CARRIED = "carried_steps";
    private static final String KEY_LAST_TOTAL = "last_total";

    private final Activity activity;
    private final WebView webView;
    private final SensorManager sensorManager;
    private final Sensor stepSensor;
    private final SharedPreferences prefs;

    private long latestRaw = -1;
    private boolean listening = false;

    StepBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.sensorManager = (SensorManager) activity.getSystemService(Context.SENSOR_SERVICE);
        this.stepSensor = sensorManager == null
                ? null
                : sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        this.prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /* ——— called from JavaScript ——————————————————————————————— */

    @JavascriptInterface
    public boolean isAvailable() {
        return stepSensor != null;
    }

    @JavascriptInterface
    public boolean hasPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return true;
        }
        return activity.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION)
                == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            onPermissionResult(true);
            return;
        }
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.requestPermissions(
                        new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
                        MainActivity.REQ_ACTIVITY_RECOGNITION);
            }
        });
    }

    /** @return today's steps, or -1 if the sensor has not reported yet. */
    @JavascriptInterface
    public int getTodaySteps() {
        return todaySteps();
    }

    @JavascriptInterface
    public String platform() {
        return "android";
    }

    /* ——— sensor lifecycle ————————————————————————————————————— */

    void start() {
        if (listening || stepSensor == null || sensorManager == null || !hasPermission()) {
            return;
        }
        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        listening = true;
    }

    void stop() {
        if (!listening || sensorManager == null) {
            return;
        }
        sensorManager.unregisterListener(this);
        listening = false;
    }

    void onPermissionResult(boolean granted) {
        if (granted) {
            start();
        }
        final String detail = granted ? "true" : "false";
        postToWeb("window.dispatchEvent(new CustomEvent('androidstepspermission',{detail:" + detail + "}))");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event == null || event.sensor == null || event.values == null || event.values.length == 0) {
            return;
        }
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) {
            return;
        }
        latestRaw = (long) event.values[0];
        int today = todaySteps();
        if (today >= 0) {
            postToWeb("window.dispatchEvent(new CustomEvent('androidsteps',{detail:" + today + "}))");
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not meaningful for a step counter.
    }

    /* ——— turning a since-boot counter into today's total ——————— */

    private String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private synchronized int todaySteps() {
        if (latestRaw < 0) {
            return -1;
        }

        String today = todayKey();
        String storedDate = prefs.getString(KEY_DATE, null);
        SharedPreferences.Editor editor = prefs.edit();

        if (!today.equals(storedDate)) {
            // First run, or a new day has started: today begins at zero from here.
            editor.putString(KEY_DATE, today)
                    .putLong(KEY_RAW, latestRaw)
                    .putInt(KEY_CARRIED, 0)
                    .putInt(KEY_LAST_TOTAL, 0)
                    .apply();
            return 0;
        }

        long baseline = prefs.getLong(KEY_RAW, -1);
        int carried = prefs.getInt(KEY_CARRIED, 0);

        if (baseline < 0) {
            editor.putLong(KEY_RAW, latestRaw).apply();
            return carried;
        }

        if (latestRaw < baseline) {
            // The device rebooted and the hardware counter restarted at zero.
            // Bank what we had already counted today and carry on from here.
            carried = prefs.getInt(KEY_LAST_TOTAL, carried);
            baseline = latestRaw;
            editor.putInt(KEY_CARRIED, carried).putLong(KEY_RAW, baseline);
        }

        int total = carried + (int) (latestRaw - baseline);
        editor.putInt(KEY_LAST_TOTAL, total).apply();
        return total;
    }

    private void postToWeb(final String script) {
        if (webView == null) {
            return;
        }
        webView.post(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.evaluateJavascript(script, null);
                }
            }
        });
    }
}
