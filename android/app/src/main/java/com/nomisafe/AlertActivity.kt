package com.nomisafe

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.content.Intent
import android.util.Log

class AlertActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Show over lock screen
    window.addFlags(
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
    )
    setContentView(R.layout.activity_alert)

    val allowBtn: Button = findViewById(R.id.allowButton)
    val cancelBtn: Button = findViewById(R.id.cancelButton)

    allowBtn.setOnClickListener {
      Log.d("AlertActivity", "Allow pressed")
      // Launch main RN activity with extra to navigate
      val intent = Intent(this, MainActivity::class.java).apply {
        putExtra("nomisafe_alert_action", "allow")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      startActivity(intent)
      finish()
    }
    cancelBtn.setOnClickListener {
      Log.d("AlertActivity", "Cancel pressed")
      finish()
    }
  }
}
