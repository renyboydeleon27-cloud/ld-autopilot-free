package com.livingdisaster.ldeditorlab;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final int NATIVE_PICK_REQUEST = 601;
    private static final String PREFS = "ld_editor_lab";
    private static final String PROJECT_STATE = "project_state";

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingNativeKind = "";
    private boolean pendingNativeMultiple = false;
    private File mediaDir;

    private OutputStream renderOutput;
    private Uri renderUri;
    private File legacyRenderFile;
    private String renderName = "";
    private String renderMime = "video/webm";

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
                intent.setType(("clips".equals(pendingNativeKind) || pendingNativeKind.startsWith("stage:")) ? "video/*" : "audio/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                try { startActivityForResult(intent, NATIVE_PICK_REQUEST); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void saveProjectState(String json) {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(PROJECT_STATE, json == null ? "" : json).apply();
        }

        @JavascriptInterface
        public String loadProjectState() {
            return getSharedPreferences(PREFS, MODE_PRIVATE).getString(PROJECT_STATE, "");
        }

        @JavascriptInterface
        public void clearProjectState() {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove(PROJECT_STATE).apply();
        }

        @JavascriptInterface
        public void deleteMedia(String id) {
            if (id == null || id.isEmpty()) return;
            File[] files = mediaDir.listFiles();
            if (files == null) return;
            for (File file : files) if (file.getName().startsWith(id + "__")) file.delete();
        }

        @JavascriptInterface
        public void clearMedia() {
            File[] files = mediaDir.listFiles();
            if (files != null) for (File file : files) file.delete();
        }

        @JavascriptInterface
        public synchronized String beginRender(String filename, String mime) {
            cancelRenderInternal();
            try {
                renderName = safeName(filename == null || filename.trim().isEmpty() ? "LD-Editor-Lab-Final.webm" : filename);
                renderMime = mime == null || mime.trim().isEmpty() ? "video/webm" : mime;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Video.Media.DISPLAY_NAME, renderName);
                    values.put(MediaStore.Video.Media.MIME_TYPE, renderMime);
                    values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/LD Editor Lab");
                    values.put(MediaStore.Video.Media.IS_PENDING, 1);
                    renderUri = getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                    if (renderUri == null) throw new Exception("Could not create media output.");
                    renderOutput = new BufferedOutputStream(getContentResolver().openOutputStream(renderUri, "w"), 1024 * 1024);
                } else {
                    File dir = new File(getExternalFilesDir(Environment.DIRECTORY_MOVIES), "LD Editor Lab");
                    if (!dir.exists()) dir.mkdirs();
                    legacyRenderFile = new File(dir, renderName);
                    renderUri = Uri.fromFile(legacyRenderFile);
                    renderOutput = new BufferedOutputStream(new FileOutputStream(legacyRenderFile), 1024 * 1024);
                }
                return jsonResult(true, null, renderUri == null ? "" : renderUri.toString(), renderName, renderMime);
            } catch (Exception e) {
                cancelRenderInternal();
                return jsonResult(false, e.getMessage(), "", "", "");
            }
        }

        @JavascriptInterface
        public synchronized String appendRenderChunk(String base64) {
            try {
                if (renderOutput == null) throw new Exception("Render output is not open.");
                byte[] data = Base64.decode(base64 == null ? "" : base64, Base64.DEFAULT);
                renderOutput.write(data);
                return jsonResult(true, null, "", "", "");
            } catch (Exception e) {
                return jsonResult(false, e.getMessage(), "", "", "");
            }
        }

        @JavascriptInterface
        public synchronized String finishRender() {
            try {
                if (renderOutput == null || renderUri == null) throw new Exception("No active render.");
                renderOutput.flush();
                renderOutput.close();
                renderOutput = null;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Video.Media.IS_PENDING, 0);
                    getContentResolver().update(renderUri, values, null, null);
                }

                String uri = renderUri.toString();
                String name = renderName;
                String mime = renderMime;
                renderUri = null;
                legacyRenderFile = null;
                renderName = "";
                renderMime = "video/webm";
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to Movies/LD Editor Lab", Toast.LENGTH_LONG).show());
                return jsonResult(true, null, uri, name, mime);
            } catch (Exception e) {
                cancelRenderInternal();
                return jsonResult(false, e.getMessage(), "", "", "");
            }
        }

        @JavascriptInterface
        public synchronized void cancelRender() {
            cancelRenderInternal();
        }

        @JavascriptInterface
        public void openMedia(String uriString, String mime) {
            if (uriString == null || uriString.trim().isEmpty()) return;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(Uri.parse(uriString), (mime == null || mime.isEmpty()) ? "video/*" : mime);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Saved video is in Movies/LD Editor Lab", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private synchronized void cancelRenderInternal() {
        try { if (renderOutput != null) renderOutput.close(); } catch (Exception ignored) {}
        renderOutput = null;
        try {
            if (renderUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getContentResolver().delete(renderUri, null, null);
            } else if (legacyRenderFile != null) {
                legacyRenderFile.delete();
            }
        } catch (Exception ignored) {}
        renderUri = null;
        legacyRenderFile = null;
        renderName = "";
        renderMime = "video/webm";
    }

    private String jsonResult(boolean ok, String error, String uri, String name, String mime) {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", ok);
            o.put("error", error == null ? JSONObject.NULL : error);
            o.put("uri", uri == null ? "" : uri);
            o.put("name", name == null ? "" : name);
            o.put("mime", mime == null ? "" : mime);
            return o.toString();
        } catch (Exception e) {
            return ok ? "{\"ok\":true}" : "{\"ok\":false,\"error\":\"Unknown native error\"}";
        }
    }

    private String displayName(Uri uri) {
        String name = null; Cursor cursor = null;
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
        if (s.length() > 120) s = s.substring(s.length() - 120);
        return s;
    }

    private JSONObject copyToPrivateStorage(Uri uri) throws Exception {
        String id = UUID.randomUUID().toString(),originalName = displayName(uri);
        String mime = getContentResolver().getType(uri);
        File outFile = new File(mediaDir, id + "__" + safeName(originalName));
        try (InputStream raw = getContentResolver().openInputStream(uri);
             BufferedInputStream in = new BufferedInputStream(raw, 65536);
             BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(outFile), 65536)) {
            byte[] buffer = new byte[65536];int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
        }
        JSONObject item = new JSONObject();
        item.put("id", id);item.put("name", originalName);item.put("mime", mime == null ? "" : mime);
        item.put("url", Uri.fromFile(outFile).toString());item.put("size", outFile.length());
        return item;
    }

    private List<Uri> selectedUris(Intent data) {
        List<Uri> uris = new ArrayList<>();
        if (data == null) return uris;
        if (data.getClipData() != null) {
            int count = data.getClipData().getItemCount();
            for (int i = 0; i < count; i++) uris.add(data.getClipData().getItemAt(i).getUri());
        } else if (data.getData() != null) uris.add(data.getData());
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
            final String kind = pendingNativeKind;final boolean multiple = pendingNativeMultiple;
            pendingNativeKind = "";pendingNativeMultiple = false;
            List<Uri> uris = resultCode == RESULT_OK ? selectedUris(data) : new ArrayList<>();
            for (Uri uri : uris) {
                try { getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); }
                catch (Exception ignored) {}
            }
            new Thread(() -> {
                JSONArray items = new JSONArray();int limit = multiple ? uris.size() : Math.min(1, uris.size());
                for (int i = 0; i < limit; i++) {
                    try { items.put(copyToPrivateStorage(uris.get(i))); } catch (Exception ignored) {}
                }
                runOnUiThread(() -> sendNativeImport(kind, items));
            }).start();
            return;
        }

        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (fileCallback == null) { super.onActivityResult(requestCode, resultCode, data);return; }
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) results = selectedUris(data).toArray(new Uri[0]);
            fileCallback.onReceiveValue(results);fileCallback = null;return;
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
        cancelRenderInternal();
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
