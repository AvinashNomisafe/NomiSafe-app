package com.nomisafe.falldetection;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.os.Handler;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.media.AudioManager;
import android.media.ToneGenerator;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class FallDetectionService extends Service implements SensorEventListener {
    public static final String ACTION_CANCEL_SOS = "com.nomisafe.falldetection.ACTION_CANCEL_SOS";
    public static volatile boolean sosCancelled = false;
    public static volatile boolean sosTimerActive = false;
    private Handler sosHandler = new Handler();
    private Runnable sosTimeoutRunnable;
    private BroadcastReceiver sosCancelReceiver;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    
    // BALANCED fall detection parameters
    // Key insight: True falls have free-fall (low-g) followed by high impact
    // Shakes have HIGH acceleration throughout - no true low-g period
    private static final float FREE_FALL_THRESHOLD = 4.0f;  // Below normal gravity (9.8) indicates falling
    private static final float IMPACT_THRESHOLD = 28.0f;    // Strong impact (shakes rarely exceed 25)
    private static final float POST_FALL_STILLNESS_THRESHOLD = 11.0f;
    private static final long FREE_FALL_DURATION_MS = 50;   // 50ms minimum free-fall (realistic for drops)
    private static final long IMPACT_WINDOW_MS = 500;       // Window after free-fall to detect impact
    private static final long STILLNESS_CHECK_DELAY_MS = 1500;
    private static final long STILLNESS_DURATION_MS = 1500; // Must stay still for 1.5 seconds
    private static final long FALL_COOLDOWN_MS = 30000;     // 30 seconds cooldown
    
    private long freeFallStartTime = 0;
    private boolean inFreeFall = false;
    private long impactTime = 0;
    private boolean impactDetected = false;
    private long lastFallTime = 0;
    private long stillnessStartTime = 0;
    private boolean checkingStillness = false;
    private long lastFreeFallEndTime = 0;  // Track when free-fall ended for impact window
    
    // For stillness detection - use more samples for accuracy
    private float[] recentAccelerations = new float[20];
    private int accelIndex = 0;
    
    // Reference to React context for sending events
    private static ReactContext reactContext;
    
    public static void setReactContext(ReactContext context) {
        reactContext = context;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        // Start as foreground service with notification FIRST
        String channelId = "fall_detection_channel";
        Notification notification;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "Fall Detection Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
            notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle("Fall Detection Active")
                .setContentText("Monitoring for falls in the background.")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setOngoing(true)
                .build();
        } else {
            notification = new NotificationCompat.Builder(this)
                .setContentTitle("Fall Detection Active")
                .setContentText("Monitoring for falls in the background.")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setOngoing(true)
                .build();
        }
        startForeground(1, notification);

        // Now register sensors with faster sampling for better detection
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        sosHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void sendEventToReactNative(String eventName, WritableMap params) {
        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];
            float acceleration = (float) Math.sqrt(x * x + y * y + z * z);
            long now = System.currentTimeMillis();
            
            // Store recent accelerations for stillness check
            recentAccelerations[accelIndex] = acceleration;
            accelIndex = (accelIndex + 1) % recentAccelerations.length;
            
            // Skip if we're in cooldown or already processing an alert
            if (sosTimerActive || (now - lastFallTime < FALL_COOLDOWN_MS)) {
                return;
            }
            
            // Phase 1: Detect free-fall (acceleration significantly below gravity)
            // Normal gravity = ~9.8 m/s², free-fall = near 0
            // Shaking produces HIGH values (15-30+), not low values
            if (acceleration < FREE_FALL_THRESHOLD) {
                if (!inFreeFall) {
                    freeFallStartTime = now;
                    inFreeFall = true;
                }
            } else {
                if (inFreeFall) {
                    long freeFallDuration = now - freeFallStartTime;
                    lastFreeFallEndTime = now;
                    inFreeFall = false;
                    
                    // If free-fall was long enough AND we have high impact immediately
                    if (freeFallDuration >= FREE_FALL_DURATION_MS && acceleration > IMPACT_THRESHOLD) {
                        impactDetected = true;
                        impactTime = now;
                        checkingStillness = false;
                        stillnessStartTime = 0;
                    }
                }
            }
            
            // Phase 2: Check for impact within window after free-fall ended
            // (impact may come a few ms after free-fall detection ends)
            if (!impactDetected && !inFreeFall && lastFreeFallEndTime > 0) {
                long timeSinceFreeFall = now - lastFreeFallEndTime;
                if (timeSinceFreeFall < IMPACT_WINDOW_MS && acceleration > IMPACT_THRESHOLD) {
                    impactDetected = true;
                    impactTime = now;
                    checkingStillness = false;
                    stillnessStartTime = 0;
                } else if (timeSinceFreeFall >= IMPACT_WINDOW_MS) {
                    // Reset free-fall tracking if window expired
                    lastFreeFallEndTime = 0;
                }
            }
            
            // Phase 3: After impact, check for SUSTAINED stillness (person lying on ground)
            if (impactDetected && (now - impactTime > STILLNESS_CHECK_DELAY_MS)) {
                float avgAccel = 0;
                float minAccel = Float.MAX_VALUE;
                float maxAccel = Float.MIN_VALUE;
                
                for (float a : recentAccelerations) {
                    avgAccel += a;
                    if (a < minAccel) minAccel = a;
                    if (a > maxAccel) maxAccel = a;
                }
                avgAccel /= recentAccelerations.length;
                
                // Check variance (stillness = very low variance)
                float variance = 0;
                for (float a : recentAccelerations) {
                    variance += (a - avgAccel) * (a - avgAccel);
                }
                variance /= recentAccelerations.length;
                
                // Range should be small for true stillness
                float range = maxAccel - minAccel;
                
                // Stillness criteria:
                // 1. Low variance (< 1.0)
                // 2. Average acceleration close to gravity (8.5-11.0)
                // 3. Reasonable range (< 2.5)
                boolean isStill = variance < 1.0f && 
                                  avgAccel > 8.5f && avgAccel < 11.0f && 
                                  range < 2.5f;
                
                if (isStill) {
                    if (!checkingStillness) {
                        // Start tracking stillness duration
                        checkingStillness = true;
                        stillnessStartTime = now;
                    } else if (now - stillnessStartTime >= STILLNESS_DURATION_MS) {
                        // Person has been still for required duration - CONFIRMED FALL
                        lastFallTime = now;
                        impactDetected = false;
                        checkingStillness = false;
                        lastFreeFallEndTime = 0;
                        triggerFallAlert();
                    }
                } else {
                    // Movement detected - reset stillness tracking
                    if (checkingStillness) {
                        checkingStillness = false;
                        stillnessStartTime = 0;
                    }
                }
                
                // Timeout: if no confirmed fall within 6 seconds of impact, reset
                if (now - impactTime > 6000) {
                    impactDetected = false;
                    checkingStillness = false;
                    lastFreeFallEndTime = 0;
                }
            }
        }
    }
    
    private void triggerFallAlert() {
        sosCancelled = false;
        sosTimerActive = true;
        sosHandler.removeCallbacksAndMessages(null);
        
        // Send event to React Native (for when app is in foreground)
        WritableMap params = Arguments.createMap();
        params.putInt("countdown", 30);
        sendEventToReactNative("FallDetected", params);
        
        // Create the full-screen intent for SOSAlertActivity
        Intent fullScreenIntent = new Intent(this, SOSAlertActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                  Intent.FLAG_ACTIVITY_CLEAR_TOP |
                                  Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, fullScreenIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Cancel intent for notification action
        Intent cancelIntent = new Intent(ACTION_CANCEL_SOS);
        cancelIntent.setPackage(getPackageName());
        PendingIntent cancelPendingIntent = PendingIntent.getBroadcast(
            getApplicationContext(), 0, cancelIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Create high-priority notification channel for SOS alerts
        String channelId = "sos_alert_channel";
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager != null) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "SOS Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Emergency fall detection alerts");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(channel);
        }
        
        // Build notification with full-screen intent
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setContentTitle("🚨 SOS! Fall Detected")
            .setContentText("Tap to respond or we'll notify your emergency contacts")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)  // This makes it show over lock screen!
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm Okay", cancelPendingIntent)
            .setContentIntent(fullScreenPendingIntent);
        
        final int notificationId = 2;
        if (manager != null) {
            manager.notify(notificationId, builder.build());
        }
        
        // Also try to launch activity directly (for when notification doesn't trigger it)
        try {
            startActivity(fullScreenIntent);
        } catch (Exception e) {
            // Activity launch failed - notification will serve as fallback
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
