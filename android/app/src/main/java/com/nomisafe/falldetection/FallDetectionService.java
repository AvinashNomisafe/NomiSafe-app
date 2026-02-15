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
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.util.Log;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class FallDetectionService extends Service implements SensorEventListener {
    public static final String ACTION_CANCEL_SOS = "com.nomisafe.falldetection.ACTION_CANCEL_SOS";
    public static volatile boolean sosCancelled = false;
    public static volatile boolean sosTimerActive = false;
    private static FallDetectionService instance;
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
    
    // Sound and vibration for SOS alert
    private static final String TAG = "FallDetectionService";
    private static final int COUNTDOWN_SECONDS = 30;
    private MediaPlayer mediaPlayer;
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private int countdownSecondsRemaining = COUNTDOWN_SECONDS;
    private Runnable countdownRunnable;
    private static final int SOS_NOTIFICATION_ID = 2;
    private NotificationManager notificationManager;
    
    public static void setReactContext(ReactContext context) {
        reactContext = context;
    }
    
    public static FallDetectionService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
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
        stopAlertSound();
        instance = null;
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
        countdownSecondsRemaining = COUNTDOWN_SECONDS;
        sosHandler.removeCallbacksAndMessages(null);
        
        // Get notification manager
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        // Start vibration IMMEDIATELY
        startVibration();
        
        // Start alarm sound IMMEDIATELY
        playAlertSound();
        
        // Send event to React Native (for when app is in foreground)
        WritableMap params = Arguments.createMap();
        params.putInt("countdown", COUNTDOWN_SECONDS);
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
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "SOS Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Emergency fall detection alerts");
            channel.enableVibration(false);  // We handle vibration separately
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }
        
        // Show initial notification and start countdown
        updateNotification(channelId, fullScreenPendingIntent, cancelPendingIntent, countdownSecondsRemaining);
        
        // Start countdown timer that updates notification every second
        countdownRunnable = new Runnable() {
            @Override
            public void run() {
                if (sosCancelled || !sosTimerActive) {
                    return;
                }
                
                if (countdownSecondsRemaining > 0) {
                    countdownSecondsRemaining--;
                    
                    // Update notification with countdown
                    updateNotification(channelId, fullScreenPendingIntent, cancelPendingIntent, countdownSecondsRemaining);
                    
                    // Send countdown event to React Native
                    WritableMap countdownParams = Arguments.createMap();
                    countdownParams.putInt("secondsRemaining", countdownSecondsRemaining);
                    sendEventToReactNative("SOSCountdown", countdownParams);
                    
                    // Schedule next tick
                    sosHandler.postDelayed(this, 1000);
                } else {
                    // Time's up - send SOS
                    sendSOS();
                }
            }
        };
        sosHandler.postDelayed(countdownRunnable, 1000);
        
        // Also try to launch activity directly (for when notification doesn't trigger it)
        try {
            startActivity(fullScreenIntent);
        } catch (Exception e) {
            Log.e(TAG, "Activity launch failed - notification will serve as fallback", e);
        }
    }
    
    private void updateNotification(String channelId, PendingIntent fullScreenPendingIntent, PendingIntent cancelPendingIntent, int seconds) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setContentTitle("🚨 SOS! Fall Detected - " + seconds + "s")
            .setContentText("Tap to respond or we'll notify your emergency contacts")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setProgress(COUNTDOWN_SECONDS, seconds, false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm Okay", cancelPendingIntent)
            .setContentIntent(fullScreenPendingIntent);
        
        if (notificationManager != null) {
            notificationManager.notify(SOS_NOTIFICATION_ID, builder.build());
        }
    }
    
    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 500, 200, 500, 200, 500};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = repeat from start
            } else {
                vibrator.vibrate(pattern, 0);
            }
            Log.i(TAG, "Started vibration");
        }
    }
    
    private void playAlertSound() {
        try {
            // Get the default alarm sound URI
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            
            if (alarmUri != null) {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(this, alarmUri);
                
                // Set audio attributes for alarm stream
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    mediaPlayer.setAudioAttributes(audioAttributes);
                } else {
                    mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                }
                
                mediaPlayer.setLooping(true);
                mediaPlayer.setVolume(1.0f, 1.0f);
                mediaPlayer.prepare();
                mediaPlayer.start();
                Log.i(TAG, "Started alarm sound with MediaPlayer");
            } else {
                startToneGeneratorLoop();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start MediaPlayer alarm, falling back to ToneGenerator", e);
            startToneGeneratorLoop();
        }
    }
    
    private void startToneGeneratorLoop() {
        try {
            toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            sosHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (!sosCancelled && sosTimerActive && toneGenerator != null) {
                        toneGenerator.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 1000);
                        sosHandler.postDelayed(this, 1500);
                    }
                }
            });
            Log.i(TAG, "Started ToneGenerator loop as fallback");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ToneGenerator", e);
        }
    }
    
    private void stopAlertSound() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.i(TAG, "Stopped MediaPlayer alarm");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping MediaPlayer", e);
            }
        }
        
        if (toneGenerator != null) {
            try {
                toneGenerator.stopTone();
                toneGenerator.release();
                toneGenerator = null;
                Log.i(TAG, "Stopped ToneGenerator");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping ToneGenerator", e);
            }
        }
        
        if (vibrator != null) {
            vibrator.cancel();
            Log.i(TAG, "Stopped vibration");
        }
    }
    
    private void sendSOS() {
        Log.i(TAG, "SOS sent to emergency contacts");
        sosTimerActive = false;
        stopAlertSound();
        
        // Send event to React Native
        WritableMap params = Arguments.createMap();
        sendEventToReactNative("SOSSent", params);
        
        // Update notification to show SOS was sent
        if (notificationManager != null) {
            String channelId = "sos_alert_channel";
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setContentTitle("📤 SOS Alert Sent")
                .setContentText("Your emergency contacts have been notified")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);
            notificationManager.notify(SOS_NOTIFICATION_ID, builder.build());
        }
        
        // TODO: Make API call to actually notify emergency contacts
    }
    
    public void cancelSOS() {
        Log.i(TAG, "SOS cancelled");
        sosCancelled = true;
        sosTimerActive = false;
        sosHandler.removeCallbacksAndMessages(null);
        stopAlertSound();
        
        // Send event to React Native
        WritableMap params = Arguments.createMap();
        sendEventToReactNative("SOSCancelled", params);
        
        // Cancel notification
        if (notificationManager != null) {
            notificationManager.cancel(SOS_NOTIFICATION_ID);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
