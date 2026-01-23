package com.nomisafe.falldetection;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationManager;
import android.util.Log;

public class SOSCancelReceiver extends BroadcastReceiver {
        public SOSCancelReceiver() { super(); }
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i("NomiSafeDebug", "SOSCancelReceiver triggered. Action: " + intent.getAction());
        // Cancel the notification
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(2);
        // Optionally, notify the service (e.g., via shared preferences, or a local broadcast)
        // For now, just log
        Log.i("NomiSafeDebug", "SOS Cancelled by user (manifest receiver)");
    }
}
