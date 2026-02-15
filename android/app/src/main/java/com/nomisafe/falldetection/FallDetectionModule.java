package com.nomisafe.falldetection;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

public class FallDetectionModule extends ReactContextBaseJavaModule implements PermissionListener {
    private static ReactApplicationContext reactContext;
    private int listenerCount = 0;
    private Promise permissionPromise;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

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
    public void requestLocationPermission(Promise promise) {
        permissionPromise = promise;
        
        // Check if permissions are already granted
        if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) 
                == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true);
            return;
        }
        
        // Request permissions
        PermissionAwareActivity activity = (PermissionAwareActivity) getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null");
            return;
        }
        
        String[] permissions = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        };
        
        activity.requestPermissions(permissions, LOCATION_PERMISSION_REQUEST_CODE, this);
    }
    
    @ReactMethod
    public void checkLocationPermission(Promise promise) {
        boolean granted = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) 
                == PackageManager.PERMISSION_GRANTED;
        promise.resolve(granted);
    }

    @Override
    public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE && permissionPromise != null) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            permissionPromise.resolve(granted);
            permissionPromise = null;
            return true;
        }
        return false;
    }

    @ReactMethod
    public void startService() {
        // Update React context in case it changed
        FallDetectionService.setReactContext(reactContext);
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.startService(serviceIntent);
        
        // Check for any pending SOS that failed to send
        FallDetectionService service = FallDetectionService.getInstance();
        if (service != null) {
            service.retryPendingSOS();
        }
    }

    @ReactMethod
    public void stopService() {
        Intent serviceIntent = new Intent(reactContext, FallDetectionService.class);
        reactContext.stopService(serviceIntent);
    }

    @ReactMethod
    public void cancelSOS() {
        // Cancel the SOS from React Native by calling the service's cancelSOS method
        FallDetectionService service = FallDetectionService.getInstance();
        if (service != null) {
            service.cancelSOS();
        } else {
            // Fallback: set flags directly if service instance not available
            FallDetectionService.sosCancelled = true;
            FallDetectionService.sosTimerActive = false;
        }
    }
    
    @ReactMethod
    public void retryPendingSOS() {
        FallDetectionService service = FallDetectionService.getInstance();
        if (service != null) {
            service.retryPendingSOS();
        }
    }
}

