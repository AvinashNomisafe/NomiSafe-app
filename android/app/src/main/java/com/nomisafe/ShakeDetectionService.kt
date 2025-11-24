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

  // Simple shake detection variables
  private var lastShakeTimestamp: Long = 0L
  private var lastAlertTimestamp: Long = 0L
  private var shakeCount: Int = 0

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
    val x = event.values[0]
    val y = event.values[1]
    val z = event.values[2]
    val gForce = sqrt(x * x + y * y + z * z)
    val threshold = 12f // Sensitive enough for accident/fall detection

    val now = System.currentTimeMillis()
    // Only log occasionally to reduce spam
    if (now - lastShakeTimestamp > 2000) {
      Log.d(TAG, "Sensor: x=$x, y=$y, z=$z, gForce=$gForce, threshold=$threshold")
    }
    
    if (gForce > threshold) {
      Log.d(TAG, "Shake detected! gForce=$gForce, shakeCount=$shakeCount")
      // Count shakes within window
      if (now - lastShakeTimestamp > 2000) {
        shakeCount = 0
      }
      shakeCount++
      if (shakeCount >= 10) {  // Require 3 rapid shakes
        Log.d(TAG, "Threshold met! Triggering alert.")
        shakeCount = 0
        triggerAlert()
      }
      lastShakeTimestamp = now
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
