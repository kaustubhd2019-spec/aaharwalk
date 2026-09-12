package com.aaharwalk.app;

import android.app.Activity;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;

/**
 * Saving a backup file out of the WebView.
 *
 * The web build downloads a blob through an <a download> link. A WebView does
 * nothing with that — no download starts and no error is raised — so inside the
 * app the backup button would quietly do nothing. This writes the file properly
 * instead, into the phone's Downloads folder where the user can find it.
 *
 * Exposed to JavaScript as `window.AndroidFiles`.
 */
public class FileBridge {

    private final Activity activity;

    FileBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public boolean isAvailable() {
        return true;
    }

    /**
     * Write a text file to Downloads.
     * @return a human-readable location, or "" if it could not be written.
     */
    @JavascriptInterface
    public String saveToDownloads(String filename, String text) {
        if (filename == null || filename.length() == 0 || text == null) {
            return "";
        }
        byte[] bytes = text.getBytes(Charset.forName("UTF-8"));

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri item = activity.getContentResolver()
                        .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (item == null) {
                    return "";
                }
                OutputStream out = activity.getContentResolver().openOutputStream(item);
                if (out == null) {
                    return "";
                }
                try {
                    out.write(bytes);
                } finally {
                    out.close();
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                activity.getContentResolver().update(item, values, null, null);
                return "Downloads/" + filename;
            }

            // Before Android 10, write somewhere we own so no storage permission is needed.
            File dir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (dir == null || (!dir.exists() && !dir.mkdirs())) {
                return "";
            }
            File file = new File(dir, filename);
            FileOutputStream out = new FileOutputStream(file);
            try {
                out.write(bytes);
            } finally {
                out.close();
            }
            return file.getAbsolutePath();
        } catch (Exception err) {
            return "";
        }
    }
}
