package com.nomisafe.falldetection

import android.app.*
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.nomisafe.R
import kotlin.math.sqrt

class FallDetectionService : Service(), SensorEventListener {
    
    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private lateinit var wakeLock: PowerManager.WakeLock
    private val buffer = mutableListOf<AccelerationSample>()
    
    private var isMonitoring = false
    private var lastFallDetectionTime = 0L
    private val cooldownPeriodMs = 120_000L // 2 minutes
    
    // Tunable thresholds
    private val freeFallThreshold = 0.5f // g
    private val impactThreshold = 2.5f // g
    private val freeFallMinDurationMs = 200L
    private val freeFallMaxDurationMs = 400L
    private val impactWindowMs = 700L
    private val stillnessWindowMs = 3000L
    private val stillnessVarianceThreshold = 0.15f
    private val bufferSizeMs = 6000L
    
    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "fall_detection_service"
        const val EMERGENCY_CHANNEL_ID = "emergency_alerts"
        const val ACTION_STOP_MONITORING = "com.nomisafe.STOP_MONITORING"
        const val ACTION_CANCEL_ALERT = "com.nomisafe.CANCEL_ALERT"
    }
    
    data class AccelerationSample(
        val timestamp: Long,
        val magnitude: Float
    )
    
    override fun onCreate() {
        super.onCreate()
        
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "NomiSafe::FallDetectionWakeLock"
        )
        
        createNotificationChannels()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_MONITORING -> {
                stopMonitoring()
                return START_NOT_STICKY
            }
            ACTION_CANCEL_ALERT -> {
                cancelEmergencyAlert()
                return START_STICKY
            }
            else -> {
                startMonitoring()
                return START_STICKY
            }
        }
    }
    
    private fun startMonitoring() {
        if (isMonitoring) return
        
        isMonitoring = true
        wakeLock.acquire(10*60*1000L) // 10 minutes max
        
        accelerometer?.let {
            sensorManager.registerListener(
                this,
                it,
                SensorManager.SENSOR_DELAY_GAME // ~50Hz
            )
        }
        
        startForeground(NOTIFICATION_ID, createForegroundNotification())
    }
    
    private fun stopMonitoring() {
        isMonitoring = false
        
        if (wakeLock.isHeld) {
            wakeLock.release()
        }
        
        sensorManager.unregisterListener(this)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }
    
    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_ACCELEROMETER) return
        
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]
        
        // Calculate magnitude in g units
        val magnitude = sqrt(x * x + y * y + z * z) / 9.81f
        
        val sample = AccelerationSample(
            timestamp = System.currentTimeMillis(),
            magnitude = magnitude
        )
        
        buffer.add(sample)
        trimBuffer()
        evaluateFallPattern()
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not used
    }
    
    private fun trimBuffer() {
        val cutoffTime = System.currentTimeMillis() - bufferSizeMs
        buffer.removeAll { it.timestamp < cutoffTime }
    }
    
    private fun evaluateFallPattern() {
        val currentTime = System.currentTimeMillis()
        
        // Check cooldown period
        if (currentTime - lastFallDetectionTime < cooldownPeriodMs) {
            return
        }
        
        if (buffer.size < 50) return // Need enough samples
        
        // Step 1: Detect free-fall segment
        val freeFallSegments = detectFreeFallSegments()
        val validFreeFall = freeFallSegments.firstOrNull { segment ->
            val duration = segment.endTime - segment.startTime
            duration in freeFallMinDurationMs..freeFallMaxDurationMs
        } ?: return
        
        // Step 2: Detect impact after free-fall
        val impactEndTime = validFreeFall.endTime + impactWindowMs
        val impactSamples = buffer.filter {
            it.timestamp >= validFreeFall.endTime && it.timestamp <= impactEndTime
        }
        
        val maxImpact = impactSamples.maxOfOrNull { it.magnitude } ?: 0f
        if (maxImpact < impactThreshold) return
        
        // Step 3: Check for stillness after impact
        val stillnessStartTime = impactEndTime
        val stillnessEndTime = stillnessStartTime + stillnessWindowMs
        val stillnessSamples = buffer.filter {
            it.timestamp >= stillnessStartTime && it.timestamp <= stillnessEndTime
        }
        
        if (stillnessSamples.size < 30) return // Need enough samples
        
        val stillnessVariance = calculateVariance(stillnessSamples.map { it.magnitude })
        if (stillnessVariance > stillnessVarianceThreshold) return
        
        // Fall detected!
        lastFallDetectionTime = currentTime
        triggerFallAlert(maxImpact)
    }
    
    private fun detectFreeFallSegments(): List<FreeFallSegment> {
        val segments = mutableListOf<FreeFallSegment>()
        var segmentStart: Long? = null
        
        for (sample in buffer) {
            if (sample.magnitude < freeFallThreshold) {
                if (segmentStart == null) {
                    segmentStart = sample.timestamp
                }
            } else {
                if (segmentStart != null) {
                    segments.add(FreeFallSegment(segmentStart, sample.timestamp))
                    segmentStart = null
                }
            }
        }
        
        // Handle ongoing free-fall at buffer end
        if (segmentStart != null && buffer.isNotEmpty()) {
            segments.add(FreeFallSegment(segmentStart, buffer.last().timestamp))
        }
        
        return segments
    }
    
    private fun calculateVariance(values: List<Float>): Float {
        if (values.isEmpty()) return 0f
        
        val mean = values.average().toFloat()
        val squaredDiffs = values.map { (it - mean) * (it - mean) }
        return squaredDiffs.average().toFloat()
    }
    
    private fun triggerFallAlert(impactG: Float) {
        // Send broadcast to React Native
        val intent = Intent("com.nomisafe.FALL_DETECTED")
        intent.putExtra("impactG", impactG)
        intent.putExtra("timestamp", System.currentTimeMillis())
        sendBroadcast(intent)
        
        // Show emergency notification
        showEmergencyNotification()
        
        // Launch full-screen alert activity
        launchEmergencyActivity(impactG)
    }
    
    private fun showEmergencyNotification() {
        val cancelIntent = Intent(this, FallDetectionService::class.java).apply {
            action = ACTION_CANCEL_ALERT
        }
        val cancelPendingIntent = PendingIntent.getService(
            this,
            0,
            cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val activityIntent = Intent(this, EmergencyAlertActivity::class.java)
        val activityPendingIntent = PendingIntent.getActivity(
            this,
            0,
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(this, EMERGENCY_CHANNEL_ID)
            .setContentTitle("🚨 Fall Detected")
            .setContentText("Are you okay? Tap to respond or alerting contacts in 30s")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(activityPendingIntent, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .addAction(
                android.R.drawable.ic_delete,
                "I'M OK",
                cancelPendingIntent
            )
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(999, notification)
    }
    
    private fun launchEmergencyActivity(impactG: Float) {
        val intent = Intent(this, EmergencyAlertActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("impactG", impactG)
            putExtra("timestamp", System.currentTimeMillis())
        }
        startActivity(intent)
    }
    
    private fun cancelEmergencyAlert() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(999)
        
        // Notify React Native
        val intent = Intent("com.nomisafe.FALL_CANCELLED")
        sendBroadcast(intent)
    }
    
    private fun createForegroundNotification(): Notification {
        val stopIntent = Intent(this, FallDetectionService::class.java).apply {
            action = ACTION_STOP_MONITORING
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Fall Detection Active")
            .setContentText("Monitoring for emergency falls")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Stop",
                stopPendingIntent
            )
            .build()
    }
    
    private fun createNotificationChannels() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Service channel
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            "Fall Detection Service",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows when fall detection is active"
            setShowBadge(false)
        }
        
        // Emergency channel
        val emergencyChannel = NotificationChannel(
            EMERGENCY_CHANNEL_ID,
            "Emergency Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Critical fall detection alerts"
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setBypassDnd(true)
            enableVibration(true)
            enableLights(true)
        }
        
        notificationManager.createNotificationChannel(serviceChannel)
        notificationManager.createNotificationChannel(emergencyChannel)
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        if (wakeLock.isHeld) {
            wakeLock.release()
        }
        sensorManager.unregisterListener(this)
    }
    
    data class FreeFallSegment(
        val startTime: Long,
        val endTime: Long
    )
}
