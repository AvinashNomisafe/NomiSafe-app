package com.nomisafe.falldetection

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class FallDetectionModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var fallDetectionReceiver: BroadcastReceiver? = null
    
    override fun getName() = "FallDetection"
    
    init {
        registerBroadcastReceiver()
    }
    
    @ReactMethod
    fun startMonitoring(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FallDetectionService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start monitoring: ${e.message}")
        }
    }
    
    @ReactMethod
    fun stopMonitoring(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FallDetectionService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop monitoring: ${e.message}")
        }
    }
    
    @ReactMethod
    fun cancelAlert(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FallDetectionService::class.java).apply {
                action = FallDetectionService.ACTION_CANCEL_ALERT
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", "Failed to cancel alert: ${e.message}")
        }
    }
    
    private fun registerBroadcastReceiver() {
        fallDetectionReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    "com.nomisafe.FALL_DETECTED" -> {
                        val params = Arguments.createMap().apply {
                            putDouble("impactG", intent.getFloatExtra("impactG", 0f).toDouble())
                            putDouble("timestamp", intent.getLongExtra("timestamp", 0L).toDouble())
                        }
                        sendEvent("onFallDetected", params)
                    }
                    "com.nomisafe.FALL_CANCELLED" -> {
                        sendEvent("onFallCancelled", null)
                    }
                    "com.nomisafe.SEND_EMERGENCY_ALERTS" -> {
                        sendEvent("onSendEmergencyAlerts", null)
                    }
                }
            }
        }
        
        val filter = IntentFilter().apply {
            addAction("com.nomisafe.FALL_DETECTED")
            addAction("com.nomisafe.FALL_CANCELLED")
            addAction("com.nomisafe.SEND_EMERGENCY_ALERTS")
        }
        
        reactApplicationContext.registerReceiver(fallDetectionReceiver, filter)
    }
    
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        fallDetectionReceiver?.let {
            reactApplicationContext.unregisterReceiver(it)
        }
    }
}
