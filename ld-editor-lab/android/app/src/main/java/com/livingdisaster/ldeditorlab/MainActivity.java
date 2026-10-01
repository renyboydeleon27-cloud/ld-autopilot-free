package com.livingdisaster.ldeditorlab;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final int NATIVE_PICK_REQUEST = 601;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingNativeKind = "";
    private boolean pendingNativeMultiple = false;
    private File mediaDir;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mediaDir = new File(getFilesDir(), "ld_editor_media");
        if (!mediaDir.exists()) mediaDir.mkdirs();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.addJavascriptInterface(new NativeBridge(), "LDNative");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = filePathCallback;
                Intent intent;
                try {
                    intent = fileChooserParams.createIntent();
                } catch (Exception e) {
                    intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                }
                if (fileChooserParams.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    public class NativeBridge {
        @JavascriptInterface
        public void pickMedia(String kind, boolean multiple) {
            runOnUiThread(() -> {
                pendingNativeKind = kind == null ? "" : kind;
                pendingNativeMultiple = multiple;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                if ("clips".equals(pendingNativeKind) || pendingNativeKind.startsWith("stage:")) {
                    intent.setType("video/*");
                } else {
                    intent.setType("audio/*");
                }
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                try {
                    startActivityForResult(intent, NATIVE_PICK_REQUEST);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void deleteMedia(String id) {
            if (id == null || id.isEmpty()) return;
            File[] files = mediaDir.listFiles();
            if (files == null) return;
            for (File file : files) {
                if (file.getName().startsWith(id + "__")) {
                    //noinspection ResultOfMethodCallIgnored
                    file.delete();
                }
            }
        }

        @JavascriptInterface
        public void clearMedia() {
            File[] files = mediaDir.listFiles();
            if (files == null) return;
            for (File file : files) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
        }
    }

    private String displayName(Uri uri) {
        String name = null;
        Cursor cursor = null;
        try {
            cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) name = cursor.getString(index);
            }
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) cursor.close();
        }
        if (name == null || name.trim().isEmpty()) name = "media_" + System.currentTimeMillis();
        return name;
    }

    private String safeName(String value) {
        String s = value == null ? "media" : value.replaceAll("[^A-Za-z0-9._ -]", "_").trim();
        if (s.isEmpty()) s = "media";
        if (s.length() > 100) s = s.substring(s.length() - 100);
        return s;
    }

    private JSONObject copyToPrivateStorage(Uri uri) throws Exception {
        String id = UUID.randomUUID().toString();
        String originalName = displayName(uri);
        String mime = getContentResolver().getType(uri);
        File outFile = new File(mediaDir, id + "__" + safeName(originalName));

        try (InputStream raw = getContentResolver().openInputStream(uri);
             BufferedInputStream in = new BufferedInputStream(raw, 65536);
             BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(outFile), 65536)) {
            byte[] buffer = new byte[65536];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
        }

        JSONObject item = new JSONObject();
        item.put("id", id);
        item.put("name", originalName);
        item.put("mime", mime == null ? "" : mime);
        item.put("url", Uri.fromFile(outFile).toString());
        item.put("size", outFile.length());
        return item;
    }

    private List<Uri> selectedUris(Intent data) {
        List<Uri> uris = new ArrayList<>();
        if (data == null) return uris;
        if (data.getClipData() != null) {
            int count = data.getClipData().getItemCount();
            for (int i = 0; i < count; i++) uris.add(data.getClipData().getItemAt(i).getUri());
        } else if (data.getData() != null) {
            uris.add(data.getData());
        }
        return uris;
    }

    private void sendNativeImport(String kind, JSONArray items) {
        String js = "window.LDNativeFilesImported&&window.LDNativeFilesImported(" +
                JSONObject.quote(kind) + "," + items.toString() + ");";
        webView.evaluateJavascript(js, null);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == NATIVE_PICK_REQUEST) {
            final String kind = pendingNativeKind;
            pendingNativeKind = "";
            List<Uri> uris = resultCode == RESULT_OK ? selectedUris(data) : new ArrayList<>();
            for (Uri uri : uris) {
                try {
                    getContentResolver().takePersistableUriPermission(
                            uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (Exception ignored) {}
            }

            new Thread(() -> {
                JSONArray items = new JSONArray();
                int limit = pendingNativeMultiple ? uris.size() : Math.min(1, uris.size());
                for (int i = 0; i < limit; i++) {
                    try { items.put(copyToPrivateStorage(uris.get(i))); }
                    catch (Exception ignored) {}
                }
                runOnUiThread(() -> sendNativeImport(kind, items));
            }).start();
            return;
        }

        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (fileCallback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                List<Uri> uris = selectedUris(data);
                results = uris.toArray(new Uri[0]);
            }
            fileCallback.onReceiveValue(results);
            fileCallback = null;
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
