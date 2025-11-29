package com.nomisafe.falldetection

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.nomisafe.R

class EmergencyAlertActivity : AppCompatActivity() {
    
    private var countDownTimer: CountDownTimer? = null
    private var secondsRemaining = 30
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Show on lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
        
        setContentView(R.layout.activity_emergency_alert)
        
        val impactG = intent.getFloatExtra("impactG", 0f)
        val timestamp = intent.getLongExtra("timestamp", 0L)
        
        setupUI()
        startCountdown()
    }
    
    private fun setupUI() {
        val cancelButton = findViewById<Button>(R.id.btn_cancel_alert)
        cancelButton.setOnClickListener {
            cancelAlert()
        }
    }
    
    private fun startCountdown() {
        val countdownText = findViewById<TextView>(R.id.tv_countdown)
        
        countDownTimer = object : CountDownTimer(30000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                secondsRemaining = (millisUntilFinished / 1000).toInt()
                countdownText.text = "Alerting contacts in $secondsRemaining seconds"
            }
            
            override fun onFinish() {
                sendEmergencyAlerts()
            }
        }.start()
    }
    
    private fun cancelAlert() {
        countDownTimer?.cancel()
        
        val intent = Intent(this, FallDetectionService::class.java).apply {
            action = FallDetectionService.ACTION_CANCEL_ALERT
        }
        startService(intent)
        
        finish()
    }
    
    private fun sendEmergencyAlerts() {
        // Broadcast to React Native to handle alert sending
        val intent = Intent("com.nomisafe.SEND_EMERGENCY_ALERTS")
        sendBroadcast(intent)
        
        finish()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
    }
}
