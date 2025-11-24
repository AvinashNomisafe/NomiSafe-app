package com.nomisafe

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlertActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    Log.d("AlertActionReceiver", "Action: $action")
    if (action == "com.nomisafe.ALLOW") {
      val i = Intent(context, MainActivity::class.java).apply {
        putExtra("nomisafe_alert_action", "allow")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(i)
    }
    // CANCEL does nothing
  }
}
