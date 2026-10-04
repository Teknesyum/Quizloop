package com.teknesyum.quizloop;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QuizloopMagaza")
public class MagazaPlugin extends Plugin {

    private static final String PLAY = "com.android.vending";

    private String installer() {
        Context c = getContext();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                return c.getPackageManager().getInstallSourceInfo(c.getPackageName()).getInstallingPackageName();
            }
            return c.getPackageManager().getInstallerPackageName(c.getPackageName());
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void kaynak(PluginCall call) {
        JSObject out = new JSObject();
        out.put("play", PLAY.equals(installer()));
        call.resolve(out);
    }

    @PluginMethod
    public void ac(PluginCall call) {
        String id = getContext().getPackageName();
        Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + id));
        market.setPackage(PLAY);
        market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(market);
        } catch (ActivityNotFoundException e) {
            Intent web = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=" + id)
            );
            web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(web);
            } catch (ActivityNotFoundException none) {
                call.reject("no-store");
                return;
            }
        }
        call.resolve();
    }
}
