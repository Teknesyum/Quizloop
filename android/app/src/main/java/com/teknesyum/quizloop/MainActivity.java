package com.teknesyum.quizloop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PaketPlugin.class);
        registerPlugin(MagazaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
