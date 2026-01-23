
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

public class FallDetectionService extends Service implements SensorEventListener {
        public static final String ACTION_CANCEL_SOS = "com.nomisafe.falldetection.ACTION_CANCEL_SOS";
        private boolean sosCancelled = false;
        private Handler sosHandler = new Handler();
        private Runnable sosTimeoutRunnable;
        private BroadcastReceiver sosCancelReceiver;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private static final float FALL_THRESHOLD = 25.0f; // Acceleration threshold for fall
    private long lastFallTime = 0;

    @Override
    public void onCreate() {
                // No dynamic receiver needed; handled by manifest receiver
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

        // Now register sensors
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
            // No dynamic receiver to unregister
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

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];
            float acceleration = (float) Math.sqrt(x * x + y * y + z * z);
            android.util.Log.d("NomiSafeDebug", "SensorEvent: x=" + x + " y=" + y + " z=" + z + " | Accel=" + acceleration);
            long now = System.currentTimeMillis();
            if (acceleration > FALL_THRESHOLD) {
                // Only trigger if not triggered in last 2 seconds
                if (now - lastFallTime > 2000) {
                    android.util.Log.i("NomiSafeDebug", "FALL DETECTED! Acceleration=" + acceleration);
                    lastFallTime = now;
                    sosCancelled = false;
                    // Play a loud alert sound
                    try {
                        ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                        toneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 3000); // 3 seconds
                        android.util.Log.i("NomiSafeDebug", "SOS alert sound played");
                    } catch (Exception e) {
                        android.util.Log.e("NomiSafeDebug", "Failed to play alert sound: " + e.getMessage());
                    }
                    // Cancel action (handled by manifest receiver)
                    Intent cancelIntent = new Intent(ACTION_CANCEL_SOS);
                    cancelIntent.setPackage(getPackageName());
                    PendingIntent cancelPendingIntent = PendingIntent.getBroadcast(getApplicationContext(), 0, cancelIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    String channelId = "fall_detection_channel";
                    NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                    final int totalSeconds = 30;
                    final int notificationId = 2;
                    final NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                        .setContentTitle("SOS! Fall Detected")
                        .setContentText("Tap to respond to emergency.")
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setAutoCancel(true)
                        .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancel", cancelPendingIntent)
                        .setProgress(totalSeconds, 0, false);
                    if (manager != null) {
                        manager.notify(notificationId, builder.build());
                        android.util.Log.i("NomiSafeDebug", "SOS notification with progress bar sent");
                    }
                    // Progress updater
                    sosHandler.post(new Runnable() {
                        int progress = 0;
                        @Override
                        public void run() {
                            if (sosCancelled) {
                                if (manager != null) manager.cancel(notificationId);
                                return;
                            }
                            if (progress < totalSeconds) {
                                builder.setProgress(totalSeconds, ++progress, false);
                                if (manager != null) manager.notify(notificationId, builder.build());
                                sosHandler.postDelayed(this, 1000);
                            } else {
                                // Time's up
                                android.util.Log.i("NomiSafeDebug", "SOS sent after 30 seconds");
                                if (manager != null) manager.cancel(notificationId);
                                // Show new notification to user
                                NotificationCompat.Builder sentBuilder = new NotificationCompat.Builder(FallDetectionService.this, channelId)
                                    .setContentTitle("SOS Sent")
                                    .setContentText("Notification was sent to your nominees.")
                                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                                    .setAutoCancel(true);
                                if (manager != null) manager.notify(3, sentBuilder.build());
                            }
                        }
                    });
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
