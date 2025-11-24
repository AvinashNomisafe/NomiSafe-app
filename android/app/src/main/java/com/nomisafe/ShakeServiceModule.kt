package com.nomisafe

import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ShakeServiceModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName(): String = "ShakeServiceModule"

  @ReactMethod
  fun startService() {
    try {
      val intent = Intent(ctx, ShakeDetectionService::class.java)
      ContextCompat.startForegroundService(ctx, intent)
    } catch (e: Exception) {
      // Swallow to prevent app crash; could emit an event later
      android.util.Log.e("ShakeServiceModule", "Failed to start service", e)
    }
  }

  @ReactMethod
  fun stopService() {
    try {
      val intent = Intent(ctx, ShakeDetectionService::class.java)
      ctx.stopService(intent)
    } catch (e: Exception) {
      android.util.Log.e("ShakeServiceModule", "Failed to stop service", e)
    }
  }

  @ReactMethod
  fun triggerTestAlert() {
    try {
      android.util.Log.d("ShakeServiceModule", "Manual test alert triggered")
      val intent = Intent(ctx, AlertActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      ctx.startActivity(intent)
    } catch (e: Exception) {
      android.util.Log.e("ShakeServiceModule", "Failed to trigger test alert", e)
    }
  }
}
