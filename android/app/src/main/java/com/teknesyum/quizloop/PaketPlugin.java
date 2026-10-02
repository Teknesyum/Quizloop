package com.teknesyum.quizloop;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@CapacitorPlugin(name = "QuizloopPaket")
public class PaketPlugin extends Plugin {

    private static final Pattern MODULE_ID = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$");
    private static final String TMP = ".tmp-";
    private static final String OLD = ".old-";
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    private File modulesDir() {
        File dir = new File(getContext().getFilesDir(), "modules");
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    private boolean inside(File parent, File child) {
        try {
            String p = parent.getCanonicalPath() + File.separator;
            return child.getCanonicalPath().startsWith(p);
        } catch (IOException e) {
            return false;
        }
    }

    private static boolean wipe(File f) {
        if (!f.exists()) return true;
        File[] kids = f.isDirectory() ? f.listFiles() : null;
        if (kids != null) for (File k : kids) wipe(k);
        return f.delete();
    }

    private long sizeOf(Uri uri) {
        ContentResolver resolver = getContext().getContentResolver();
        try (ParcelFileDescriptor pfd = resolver.openFileDescriptor(uri, "r")) {
            if (pfd != null && pfd.getStatSize() > 0) return pfd.getStatSize();
        } catch (Exception ignored) {}
        try (Cursor c = resolver.query(uri, new String[] { OpenableColumns.SIZE }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception ignored) {}
        return -1;
    }

    private String nameOf(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getString(0);
        } catch (Exception ignored) {}
        return uri.getLastPathSegment();
    }

    @PluginMethod
    public void root(PluginCall call) {
        JSObject r = new JSObject();
        r.put("path", modulesDir().getAbsolutePath());
        call.resolve(r);
    }

    @PluginMethod
    public void pick(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(call, intent, "picked");
    }

    @ActivityCallback
    private void picked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            r.put("cancelled", true);
            call.resolve(r);
            return;
        }
        Uri uri = data.getData();
        r.put("cancelled", false);
        r.put("uri", uri.toString());
        r.put("name", nameOf(uri));
        r.put("size", sizeOf(uri));
        call.resolve(r);
    }

    private static final class Counting extends FilterInputStream {
        long count = 0;

        Counting(InputStream in) {
            super(in);
        }

        @Override
        public int read() throws IOException {
            int b = super.read();
            if (b >= 0) count++;
            return b;
        }

        @Override
        public int read(byte[] buf, int off, int len) throws IOException {
            int n = super.read(buf, off, len);
            if (n > 0) count += n;
            return n;
        }

        @Override
        public long skip(long n) throws IOException {
            long s = super.skip(n);
            if (s > 0) count += s;
            return s;
        }
    }

    private File findRoot(File dir) {
        if (new File(dir, "module.json").isFile()) return dir;
        File[] kids = dir.listFiles(File::isDirectory);
        if (kids != null && kids.length == 1 && new File(kids[0], "module.json").isFile()) return kids[0];
        return null;
    }

    private void progress(long done, long total) {
        JSObject p = new JSObject();
        p.put("done", done);
        p.put("total", total);
        notifyListeners("progress", p);
    }

    @PluginMethod
    public void unpack(PluginCall call) {
        String raw = call.getString("uri");
        if (raw == null || raw.isEmpty()) {
            call.reject("uri is required");
            return;
        }
        worker.execute(() -> runUnpack(call, Uri.parse(raw)));
    }

    private void runUnpack(PluginCall call, Uri uri) {
        long t0 = SystemClock.elapsedRealtime();
        File modules = modulesDir();
        long size = sizeOf(uri);
        long free = modules.getUsableSpace();
        if (size > 0 && free < size * 2) {
            JSObject d = new JSObject();
            d.put("need", size * 2);
            d.put("free", free);
            call.reject("not enough free space: need " + (size * 2 / 1048576) + " MB, free " + (free / 1048576) + " MB", "NO_SPACE", d);
            return;
        }
        File tmp = new File(modules, TMP + UUID.randomUUID().toString().substring(0, 8));
        if (!tmp.mkdirs()) {
            call.reject("cannot create " + tmp.getName());
            return;
        }
        long written = 0;
        int files = 0;
        byte[] buf = new byte[256 * 1024];
        try (InputStream raw = getContext().getContentResolver().openInputStream(uri)) {
            if (raw == null) throw new IOException("cannot open package");
            Counting counting = new Counting(new BufferedInputStream(raw, 256 * 1024));
            long lastAt = 0;
            long lastDone = 0;
            progress(0, size);
            try (ZipInputStream zip = new ZipInputStream(counting)) {
                ZipEntry e;
                while ((e = zip.getNextEntry()) != null) {
                    File out = new File(tmp, e.getName());
                    if (!inside(tmp, out)) throw new IOException("path escapes package: " + e.getName());
                    if (e.isDirectory()) {
                        out.mkdirs();
                        continue;
                    }
                    File parent = out.getParentFile();
                    if (parent != null && !parent.exists()) parent.mkdirs();
                    try (OutputStream os = new BufferedOutputStream(new FileOutputStream(out), 256 * 1024)) {
                        int n;
                        while ((n = zip.read(buf)) > 0) {
                            os.write(buf, 0, n);
                            written += n;
                            long now = SystemClock.elapsedRealtime();
                            long done = counting.count;
                            if (now - lastAt >= 200 || (size > 0 && done - lastDone >= size / 100)) {
                                lastAt = now;
                                lastDone = done;
                                progress(done, size);
                            }
                        }
                    }
                    files++;
                }
            }
            progress(size > 0 ? size : counting.count, size > 0 ? size : counting.count);
        } catch (Exception ex) {
            wipe(tmp);
            call.reject("unpack failed: " + ex.getMessage(), ex);
            return;
        }
        File root = findRoot(tmp);
        JSObject r = new JSObject();
        r.put("tmp", tmp.getAbsolutePath());
        r.put("root", root == null ? null : root.getAbsolutePath());
        r.put("size", size);
        r.put("free", free);
        r.put("written", written);
        r.put("files", files);
        r.put("ms", SystemClock.elapsedRealtime() - t0);
        call.resolve(r);
    }

    @PluginMethod
    public void commit(PluginCall call) {
        String tmpPath = call.getString("tmp");
        String rootPath = call.getString("root");
        String id = call.getString("id");
        if (tmpPath == null || rootPath == null || id == null || !MODULE_ID.matcher(id).matches()) {
            call.reject("invalid commit arguments");
            return;
        }
        worker.execute(() -> {
            long t0 = SystemClock.elapsedRealtime();
            File modules = modulesDir();
            File tmp = new File(tmpPath);
            File root = new File(rootPath);
            if (!tmp.getName().startsWith(TMP) || !inside(modules, tmp) || !(root.equals(tmp) || inside(tmp, root))) {
                call.reject("commit outside modules folder");
                return;
            }
            File target = new File(modules, id);
            File old = null;
            if (target.exists()) {
                old = new File(modules, OLD + id + "-" + SystemClock.elapsedRealtime());
                if (!target.renameTo(old)) {
                    call.reject("cannot move existing module aside");
                    return;
                }
            }
            if (!root.renameTo(target)) {
                if (old != null) old.renameTo(target);
                call.reject("cannot move module into place");
                return;
            }
            if (old != null) wipe(old);
            wipe(tmp);
            JSObject r = new JSObject();
            r.put("path", target.getAbsolutePath());
            r.put("ms", SystemClock.elapsedRealtime() - t0);
            call.resolve(r);
        });
    }

    @PluginMethod
    public void discard(PluginCall call) {
        String tmpPath = call.getString("tmp");
        worker.execute(() -> {
            if (tmpPath != null) {
                File tmp = new File(tmpPath);
                if (tmp.getName().startsWith(TMP) && inside(modulesDir(), tmp)) wipe(tmp);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void sweep(PluginCall call) {
        worker.execute(() -> {
            int removed = 0;
            File[] kids = modulesDir().listFiles();
            if (kids != null) for (File k : kids) {
                String n = k.getName();
                if ((n.startsWith(TMP) || n.startsWith(OLD)) && wipe(k)) removed++;
            }
            JSObject r = new JSObject();
            r.put("removed", removed);
            call.resolve(r);
        });
    }

    @PluginMethod
    public void exists(PluginCall call) {
        String path = call.getString("path");
        JSObject r = new JSObject();
        r.put("exists", path != null && inside(getContext().getFilesDir(), new File(path)) && new File(path).exists());
        call.resolve(r);
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String path = call.getString("path");
        worker.execute(() -> {
            File modules = modulesDir();
            if (path != null) {
                File f = new File(path);
                if (inside(modules, f)) wipe(f);
            }
            call.resolve();
        });
    }
}
