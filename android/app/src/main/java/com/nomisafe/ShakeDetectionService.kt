package com.nomisafe

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class ShakeDetectionService : Service(), SensorEventListener {
  private lateinit var sensorManager: SensorManager
  private var accelerometer: Sensor? = null

  // Fall detection variables
  private var lastFallTimestamp: Long = 0L
  private var lastAlertTimestamp: Long = 0L
  private var fallCount: Int = 0
  private val gravity = FloatArray(3)
  private val linearAcceleration = FloatArray(3)
  private val alpha: Float = 0.8f

  private val TAG = "ShakeService"
  private val FOREGROUND_CHANNEL_ID = "shake_service_channel"
  private val ALERT_CHANNEL_ID = "shake_alert_channel"
  private val FOREGROUND_NOTIFICATION_ID = 9101
  private val ALERT_NOTIFICATION_ID = 9102

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "ShakeDetectionService onCreate() called")
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    registerListener()
    createChannels()
    Log.d(TAG, "About to call startForeground")
    startForeground(
      FOREGROUND_NOTIFICATION_ID,
      buildPersistentNotification()
    )
    Log.d(TAG, "startForeground completed successfully")
  }

  private fun registerListener() {
    accelerometer?.let {
      sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
    }
  }

  private fun unregisterListener() {
    sensorManager.unregisterListener(this)
  }

  override fun onDestroy() {
    super.onDestroy()
    unregisterListener()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    return START_STICKY
  }

  private fun createChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (nm.getNotificationChannel(FOREGROUND_CHANNEL_ID) == null) {
        nm.createNotificationChannel(
          NotificationChannel(
            FOREGROUND_CHANNEL_ID,
            "Shake Detection",
            NotificationManager.IMPORTANCE_MIN
          ).apply { description = "Running shake detection" }
        )
      }
      if (nm.getNotificationChannel(ALERT_CHANNEL_ID) == null) {
        nm.createNotificationChannel(
          NotificationChannel(
            ALERT_CHANNEL_ID,
            "Nomisafe Alert",
            NotificationManager.IMPORTANCE_HIGH
          ).apply { description = "Shake triggered alert" }
        )
      }
    }
  }

  private fun buildPersistentNotification(): Notification {
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    return NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_info_details)
      .setContentTitle("Nomisafe active")
      .setContentText("Shake phone for quick alert")
      .setOngoing(true)
      .setContentIntent(pendingIntent)
      .build()
  }

  private fun buildAlertNotification(fullScreenIntent: PendingIntent): Notification {
    val allowIntent = Intent(this, AlertActionReceiver::class.java).apply {
      action = "com.nomisafe.ALLOW"
    }
    val cancelIntent = Intent(this, AlertActionReceiver::class.java).apply {
      action = "com.nomisafe.CANCEL"
    }
    val allowPending = PendingIntent.getBroadcast(this, 1, allowIntent, PendingIntent.FLAG_IMMUTABLE)
    val cancelPending = PendingIntent.getBroadcast(this, 2, cancelIntent, PendingIntent.FLAG_IMMUTABLE)

    return NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle("Nomisafe Alert")
      .setContentText("Shake detected. Respond?")
      .addAction(NotificationCompat.Action(0, "Allow", allowPending))
      .addAction(NotificationCompat.Action(0, "Cancel", cancelPending))
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setFullScreenIntent(fullScreenIntent, true)
      .build()
  }

  private fun triggerAlert() {
    val now = System.currentTimeMillis()
    // Cooldown 30s
    if (now - lastAlertTimestamp < 30_000) {
      Log.d(TAG, "Alert on cooldown, ignoring")
      return
    }
    lastAlertTimestamp = now
    Log.d(TAG, "Shake threshold met – triggering alert")

    // Directly launch AlertActivity
    val alertActivityIntent = Intent(this, AlertActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    startActivity(alertActivityIntent)
    Log.d(TAG, "AlertActivity launched directly")

    // Also show notification as backup
    val fullScreenPending = PendingIntent.getActivity(
      this,
      100,
      alertActivityIntent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(ALERT_NOTIFICATION_ID, buildAlertNotification(fullScreenPending))
  }

  override fun onSensorChanged(event: SensorEvent?) {
    if (event?.sensor?.type != Sensor.TYPE_ACCELEROMETER) return
    
    // Apply low-pass filter to isolate gravity
    gravity[0] = alpha * gravity[0] + (1 - alpha) * event.values[0]
    gravity[1] = alpha * gravity[1] + (1 - alpha) * event.values[1]
    gravity[2] = alpha * gravity[2] + (1 - alpha) * event.values[2]
    
    // Remove gravity contribution to get linear acceleration
    linearAcceleration[0] = event.values[0] - gravity[0]
    linearAcceleration[1] = event.values[1] - gravity[1]
    linearAcceleration[2] = event.values[2] - gravity[2]
    
    val magnitude = sqrt(
        linearAcceleration[0] * linearAcceleration[0] +
        linearAcceleration[1] * linearAcceleration[1] +
        linearAcceleration[2] * linearAcceleration[2]
    )
    
    val now = System.currentTimeMillis()
    
    // Log occasionally to reduce spam
    if (now - lastFallTimestamp > 2000) {
        Log.d(TAG, "Linear acceleration magnitude: $magnitude")
    }
    
    // Fall detection logic
    // A fall is characterized by a sudden spike in linear acceleration followed by a period of low movement
    if (magnitude > 15f) { // High acceleration threshold for impact
        Log.d(TAG, "High impact detected! magnitude=$magnitude")
        if (now - lastFallTimestamp > 1000) { // Reset if last detection was more than 1 second ago
            fallCount = 0
        }
        fallCount++
        lastFallTimestamp = now
        
        // Check for subsequent low movement (person may be on ground)
        // We'll use a delayed check
        android.os.Handler(mainLooper).postDelayed({
            // Check current acceleration after 1 second
            val currentMagnitude = sqrt(
                linearAcceleration[0] * linearAcceleration[0] +
                linearAcceleration[1] * linearAcceleration[1] +
                linearAcceleration[2] * linearAcceleration[2]
            )
            if (currentMagnitude < 2f) { // Very low movement
                Log.d(TAG, "Low movement after impact - possible fall detected!")
                triggerAlert()
            }
        }, 1000)
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
