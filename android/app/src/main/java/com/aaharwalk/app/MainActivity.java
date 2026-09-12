package com.aaharwalk.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;

/**
 * Hosts the AaharWalk web app in a WebView.
 *
 * The bundled files are served through WebViewAssetLoader on
 * https://appassets.androidplatform.net/ rather than file://, because that is
 * a secure context — which is what motion sensors, the screen wake lock and
 * service workers all require. Everything still runs offline from the APK.
 */
public class MainActivity extends Activity {

    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_PAGE = ORIGIN + "/assets/www/index.html";

    static final int REQ_ACTIVITY_RECOGNITION = 4011;

    private WebView webView;
    private StepBridge stepBridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        // Nothing needs the filesystem: the asset loader serves everything.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost())) {
                    return false;
                }
                // Anything off our own origin opens in the browser, not in here.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    return true;
                }
                return true;
            }
        });

        // The web app registers a service worker; route its requests to the same assets.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(new ServiceWorkerClientCompat() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return loader.shouldInterceptRequest(request.getUrl());
                }
            });
        }

        stepBridge = new StepBridge(this, webView);
        webView.addJavascriptInterface(stepBridge, "AndroidSteps");

        webView.loadUrl(START_PAGE + sharedQuery(getIntent()));
    }

    /**
     * Step Set Go (or Google Fit, or anything else) sharing text into the app
     * arrives as ACTION_SEND. Hand it to the web app the same way the PWA
     * share target does, so one code path reads the step count.
     */
    private String sharedQuery(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) {
            return "";
        }
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        StringBuilder query = new StringBuilder();
        if (subject != null && subject.length() > 0) {
            query.append("share_title=").append(Uri.encode(subject));
        }
        if (text != null && text.length() > 0) {
            if (query.length() > 0) {
                query.append('&');
            }
            query.append("share_text=").append(Uri.encode(text));
        }
        return query.length() == 0 ? "" : "?" + query;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String query = sharedQuery(intent);
        if (query.length() > 0 && webView != null) {
            webView.loadUrl(START_PAGE + query);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (stepBridge != null) {
            stepBridge.start();
        }
    }

    @Override
    protected void onStop() {
        if (stepBridge != null) {
            stepBridge.stop();
        }
        super.onStop();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_ACTIVITY_RECOGNITION && stepBridge != null) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            stepBridge.onPermissionResult(granted);
        }
    }

    @Override
    public void onBackPressed() {
        // The app is a single page with hash routing, so this walks back through screens.
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
