package com.renstudio.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.content.Intent;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.graphics.drawable.GradientDrawable;

public class MainActivity extends Activity {
    private static final String BASE = "https://ld-autopilot-free.vercel.app/";
    private static final String DRAMA = BASE + "ai-drama.html";
    private static final String ANIME = BASE + "anime-adventure.html";
    private static final int FILE_CHOOSER_REQUEST = 4512;

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(10, 16, 24));
        getWindow().setNavigationBarColor(Color.rgb(10, 16, 24));
        root = new FrameLayout(this);
        setContentView(root);
        showHome();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable rounded(int color, int strokeColor) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(16));
        d.setStroke(dp(1), strokeColor);
        return d;
    }

    private TextView label(String text, float size, int color, boolean bold) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextSize(size);
        v.setTextColor(color);
        if (bold) v.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return v;
    }

    private Button studioButton(String title, String subtitle, int color, String url) {
        Button b = new Button(this);
        b.setAllCaps(false);
        b.setText(title + "\n" + subtitle);
        b.setTextSize(17);
        b.setTextColor(Color.WHITE);
        b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        b.setPadding(dp(18), dp(16), dp(18), dp(16));
        b.setBackground(rounded(color, Color.argb(180, 95, 130, 165)));
        b.setOnClickListener(v -> openStudio(url));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(86));
        lp.topMargin = dp(14);
        b.setLayoutParams(lp);
        return b;
    }

    private void showHome() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        root.removeAllViews();
        root.setBackgroundColor(Color.rgb(10, 16, 24));

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(22), dp(34), dp(22), dp(24));
        page.setGravity(Gravity.TOP);

        TextView eyebrow = label("REN CREATIVE WORKSPACE", 12, Color.rgb(143, 168, 194), true);
        eyebrow.setLetterSpacing(0.12f);
        page.addView(eyebrow);

        TextView title = label("REN STUDIO", 34, Color.WHITE, true);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleLp.topMargin = dp(8);
        title.setLayoutParams(titleLp);
        page.addView(title);

        TextView sub = label("Separate workspace for AI Drama and Anime Adventure. Your fiction projects stay away from the Living Disaster production workspace.", 15, Color.rgb(184, 199, 216), false);
        sub.setLineSpacing(0, 1.2f);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        subLp.topMargin = dp(10);
        sub.setLayoutParams(subLp);
        page.addView(sub);

        page.addView(studioButton("AI Drama", "10-second text-to-video episode workspace", Color.rgb(34, 104, 173), DRAMA));
        page.addView(studioButton("Anime Adventure", "Anime fantasy episode & continuity workspace", Color.rgb(118, 72, 181), ANIME));

        TextView note = label("Internet is required for AI polishing. Projects are stored inside REN STUDIO on this phone.", 12, Color.rgb(130, 151, 174), false);
        LinearLayout.LayoutParams noteLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        noteLp.topMargin = dp(22);
        note.setLayoutParams(noteLp);
        page.addView(note);

        root.addView(page, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void openStudio(String url) {
        root.removeAllViews();

        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " RENStudio/1.0");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progress != null) {
                    progress.setProgress(newProgress);
                    progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "File picker unavailable.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            private boolean route(Uri uri) {
                String host = uri.getHost() == null ? "" : uri.getHost();
                String path = uri.getPath() == null ? "/" : uri.getPath();

                if ("ld-autopilot-free.vercel.app".equalsIgnoreCase(host)) {
                    if ("/".equals(path) || "/index.html".equals(path) || "/ren-studio.html".equals(path)) {
                        showHome();
                        return true;
                    }
                    return false;
                }

                if ("accounts.google.com".equalsIgnoreCase(host)) return false;

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                    Toast.makeText(MainActivity.this, "Cannot open this link.", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return route(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return route(Uri.parse(url));
            }
        });

        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        FrameLayout.LayoutParams pp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3));
        pp.gravity = Gravity.TOP;
        root.addView(progress, pp);

        webView.loadUrl(url);
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            if (webView.canGoBack()) webView.goBack();
            else showHome();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
            if (fileCallback != null) {
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
