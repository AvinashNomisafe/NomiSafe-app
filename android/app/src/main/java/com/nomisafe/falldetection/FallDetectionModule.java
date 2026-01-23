package com.nomisafe.falldetection;

import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FallDetectionModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    FallDetectionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "FallDetectionModule";
    }

    @ReactMethod
    public void startService() {
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.startService(serviceIntent);
    }

    @ReactMethod
    public void stopService() {
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.stopService(serviceIntent);
    }
}
