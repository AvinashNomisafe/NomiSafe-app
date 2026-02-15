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
        
        // Call cancelSOS on the service instance to stop sound/vibration
        FallDetectionService service = FallDetectionService.getInstance();
        if (service != null) {
            service.cancelSOS();
        } else {
            // Fallback: Set the cancel flag if service instance not available
            FallDetectionService.sosCancelled = true;
            FallDetectionService.sosTimerActive = false;
            // Cancel the notification
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.cancel(2);
        }
        
        Log.i("NomiSafeDebug", "SOS Cancelled by user (manifest receiver)");
    }
}
