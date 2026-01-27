package com.nomisafe.falldetection;

import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FallDetectionModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private int listenerCount = 0;

    FallDetectionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        // Set the React context for the service to send events
        FallDetectionService.setReactContext(context);
    }

    @Override
    public String getName() {
        return "FallDetectionModule";
    }

    // Required for NativeEventEmitter
    @ReactMethod
    public void addListener(String eventName) {
        listenerCount++;
    }

    // Required for NativeEventEmitter
    @ReactMethod
    public void removeListeners(int count) {
        listenerCount -= count;
        if (listenerCount < 0) listenerCount = 0;
    }

    @ReactMethod
    public void startService() {
        // Update React context in case it changed
        FallDetectionService.setReactContext(reactContext);
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.startService(serviceIntent);
    }

    @ReactMethod
    public void stopService() {
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.stopService(serviceIntent);
    }

    @ReactMethod
    public void cancelSOS() {
        // Cancel the SOS from React Native
        FallDetectionService.sosCancelled = true;
    }
}

