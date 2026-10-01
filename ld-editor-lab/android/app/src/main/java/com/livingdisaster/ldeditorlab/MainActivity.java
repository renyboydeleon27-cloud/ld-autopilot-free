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
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final int NATIVE_PICK_REQUEST = 601;
    private static final String PREFS = "ld_editor_lab";
    private static final String PROJECT_STATE = "project_state";
    private static final String ACTIVE_WEB_DIR = "active_web_dir";
    private static final String ACTIVE_WEB_VERSION = "active_web_version";
    private static final String BUNDLED_WEB_VERSION = "0.4.0";
    private static final String NATIVE_APP_VERSION = "0.4.0";
    private static final String UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/renyboydeleon27-cloud/ld-autopilot-free/main/ld-editor-lab/update-manifest.json";
    private static final String UPDATE_HOST_PREFIX = "https://raw.githubusercontent.com/renyboydeleon27-cloud/ld-autopilot-free/";

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingNativeKind = "";
    private boolean pendingNativeMultiple = false;
    private File mediaDir;
    private File webBundleRoot;
    private volatile boolean updateCheckStarted = false;

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
        webBundleRoot = new File(getFilesDir(), "ld_editor_web_bundles");
        if (!webBundleRoot.exists()) webBundleRoot.mkdirs();

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
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (!updateCheckStarted) {
                    updateCheckStarted = true;
                    checkForWebUpdateAsync();
                }
            }
        });
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

        webView.loadUrl(startPageUrl());
    }

    public class NativeBridge {
        @JavascriptInterface
        public String getWebUpdateState() {
            try {
                JSONObject o = new JSONObject();
                o.put("currentVersion", currentWebVersion());
                o.put("bundledVersion", BUNDLED_WEB_VERSION);
                o.put("nativeVersion", NATIVE_APP_VERSION);
                o.put("selfUpdate", true);
                return o.toString();
            } catch (Exception e) {
                return "{\"currentVersion\":\""+BUNDLED_WEB_VERSION+"\",\"selfUpdate\":true}";
            }
        }

        @JavascriptInterface
        public void checkWebUpdate() {
            checkForWebUpdateAsync();
        }

        @JavascriptInterface
        public void installWebUpdate() {
            installWebUpdateAsync();
        }

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

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }

    private boolean validWebBundle(File dir) {
        return dir != null && dir.isDirectory()
                && new File(dir, "index.html").isFile()
                && new File(dir, "app.js").isFile()
                && new File(dir, "styles.css").isFile();
    }

    private String startPageUrl() {
        String dirName = prefs().getString(ACTIVE_WEB_DIR, "");
        if (dirName != null && !dirName.isEmpty()) {
            File dir = new File(webBundleRoot, dirName);
            if (validWebBundle(dir)) return Uri.fromFile(new File(dir, "index.html")).toString();
            prefs().edit().remove(ACTIVE_WEB_DIR).remove(ACTIVE_WEB_VERSION).apply();
        }
        return "file:///android_asset/index.html";
    }

    private String currentWebVersion() {
        String dirName = prefs().getString(ACTIVE_WEB_DIR, "");
        String version = prefs().getString(ACTIVE_WEB_VERSION, "");
        if (dirName != null && !dirName.isEmpty() && version != null && !version.isEmpty()) {
            File dir = new File(webBundleRoot, dirName);
            if (validWebBundle(dir)) return version;
        }
        return BUNDLED_WEB_VERSION;
    }

    private int parseVersionPart(String value) {
        if (value == null) return 0;
        String digits = value.replaceFirst("[^0-9].*$", "");
        try { return digits.isEmpty() ? 0 : Integer.parseInt(digits); } catch (Exception e) { return 0; }
    }

    private int compareVersions(String a, String b) {
        String[] aa = (a == null ? "" : a).split("\\.");
        String[] bb = (b == null ? "" : b).split("\\.");
        int n = Math.max(aa.length, bb.length);
        for (int i = 0; i < n; i++) {
            int av = i < aa.length ? parseVersionPart(aa[i]) : 0;
            int bv = i < bb.length ? parseVersionPart(bb[i]) : 0;
            if (av != bv) return Integer.compare(av, bv);
        }
        return 0;
    }

    private boolean allowedUpdateUrl(String url) {
        return url != null && url.startsWith(UPDATE_HOST_PREFIX);
    }

    private HttpURLConnection openUpdateConnection(String url) throws Exception {
        if (!allowedUpdateUrl(url)) throw new Exception("Update source is not allowed.");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(12000);
        conn.setReadTimeout(20000);
        conn.setRequestProperty("User-Agent", "LD-Editor-Lab/" + NATIVE_APP_VERSION);
        conn.setInstanceFollowRedirects(true);
        return conn;
    }

    private String readUpdateText(String url) throws Exception {
        HttpURLConnection conn = openUpdateConnection(url);
        try {
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) throw new Exception("Update server returned " + code + ".");
            try (InputStream in = new BufferedInputStream(conn.getInputStream());
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[32768]; int read;
                while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
                return out.toString("UTF-8");
            }
        } finally { conn.disconnect(); }
    }

    private void downloadUpdateFile(String url, File target) throws Exception {
        HttpURLConnection conn = openUpdateConnection(url);
        try {
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) throw new Exception("Download failed with " + code + ".");
            File parent = target.getParentFile(); if (parent != null && !parent.exists()) parent.mkdirs();
            try (InputStream in = new BufferedInputStream(conn.getInputStream(), 65536);
                 BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(target), 65536)) {
                byte[] buffer = new byte[65536]; int read;
                while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
            }
            if (!target.isFile() || target.length() == 0) throw new Exception("Downloaded file is empty.");
        } finally { conn.disconnect(); }
    }

    private JSONObject fetchUpdateManifest() throws Exception {
        JSONObject manifest = new JSONObject(readUpdateText(UPDATE_MANIFEST_URL));
        String version = manifest.optString("version", "").trim();
        JSONArray files = manifest.optJSONArray("files");
        if (version.isEmpty() || files == null || files.length() < 3) throw new Exception("Invalid update manifest.");
        return manifest;
    }

    private void sendUpdateStatus(String status, String version, String message, String notes) {
        try {
            JSONObject o = new JSONObject();
            o.put("status", status == null ? "" : status);
            o.put("version", version == null ? "" : version);
            o.put("message", message == null ? "" : message);
            o.put("notes", notes == null ? "" : notes);
            String js = "window.LDWebUpdateStatus&&window.LDWebUpdateStatus(" + o.toString() + ");";
            runOnUiThread(() -> webView.evaluateJavascript(js, null));
        } catch (Exception ignored) {}
    }

    private void checkForWebUpdateAsync() {
        new Thread(() -> {
            try {
                JSONObject manifest = fetchUpdateManifest();
                String remote = manifest.optString("version", "");
                String notes = manifest.optString("notes", "");
                String current = currentWebVersion();
                if (compareVersions(remote, current) > 0) sendUpdateStatus("available", remote, "", notes);
                else sendUpdateStatus("current", current, "", "");
            } catch (Exception e) {
                sendUpdateStatus("error", currentWebVersion(), e.getMessage(), "");
            }
        }, "ld-update-check").start();
    }

    private void deleteRecursive(File file) {
        if (file == null || !file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) for (File child : children) deleteRecursive(child);
        }
        file.delete();
    }

    private void installWebUpdateAsync() {
        new Thread(() -> {
            File staging = null;
            try {
                JSONObject manifest = fetchUpdateManifest();
                String version = manifest.optString("version", "").trim();
                String notes = manifest.optString("notes", "");
                if (compareVersions(version, currentWebVersion()) <= 0) {
                    sendUpdateStatus("current", currentWebVersion(), "", "");
                    return;
                }
                sendUpdateStatus("installing", version, "", notes);
                String safeVersion = version.replaceAll("[^A-Za-z0-9._-]", "_");
                staging = new File(webBundleRoot, ".tmp-" + safeVersion);
                deleteRecursive(staging);
                if (!staging.mkdirs() && !staging.isDirectory()) throw new Exception("Could not prepare update storage.");

                JSONArray files = manifest.getJSONArray("files");
                for (int i = 0; i < files.length(); i++) {
                    JSONObject entry = files.getJSONObject(i);
                    String name = entry.optString("name", "");
                    String url = entry.optString("url", "");
                    if (!name.matches("[A-Za-z0-9._-]+")) throw new Exception("Invalid update filename.");
                    downloadUpdateFile(url, new File(staging, name));
                }
                if (!validWebBundle(staging)) throw new Exception("Update package is incomplete.");

                File finalDir = new File(webBundleRoot, "bundle-" + safeVersion);
                if (finalDir.exists()) deleteRecursive(finalDir);
                if (!staging.renameTo(finalDir)) throw new Exception("Could not activate update.");
                staging = null;
                prefs().edit().putString(ACTIVE_WEB_DIR, finalDir.getName()).putString(ACTIVE_WEB_VERSION, version).apply();
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "LD Editor Lab updated to v" + version, Toast.LENGTH_LONG).show();
                    webView.loadUrl(Uri.fromFile(new File(finalDir, "index.html")).toString());
                });
            } catch (Exception e) {
                if (staging != null) deleteRecursive(staging);
                sendUpdateStatus("error", currentWebVersion(), e.getMessage(), "");
            }
        }, "ld-update-install").start();
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
