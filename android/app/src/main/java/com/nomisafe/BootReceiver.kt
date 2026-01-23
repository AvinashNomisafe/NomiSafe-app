package com.nomisafe

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.nomisafe.falldetection.FallDetectionService

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      Log.d("BootReceiver", "Device booted, restarting FallDetectionService")
      val serviceIntent = Intent(context, FallDetectionService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ContextCompat.startForegroundService(context, serviceIntent)
      } else {
        context.startService(serviceIntent)
      }
    }
  }
}
