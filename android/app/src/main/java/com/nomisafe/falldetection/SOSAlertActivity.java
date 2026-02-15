package com.nomisafe.falldetection;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.util.Log;

/**
 * Full-screen SOS Alert Activity that appears over lock screen
 * Similar to incoming call or alarm behavior
 */
public class SOSAlertActivity extends Activity {
    private static final String TAG = "SOSAlertActivity";
    private static final int COUNTDOWN_SECONDS = 30;
    
    private TextView countdownText;
    private ProgressBar progressBar;
    private Button cancelButton;
    private Handler handler = new Handler();
    private int secondsRemaining = COUNTDOWN_SECONDS;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private boolean isCancelled = false;
    private MediaPlayer mediaPlayer;  // For continuous alarm sound
    private ToneGenerator toneGenerator;  // Fallback tone generator
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "SOSAlertActivity onCreate");
        
        // Make activity show over lock screen
        setupWindowFlags();
        
        // Acquire wake lock to keep screen on
        acquireWakeLock();
        
        // Set up the UI
        setContentView(createContentView());
        
        // Note: Sound and vibration are started in FallDetectionService immediately when fall is detected
        // We don't start them here to avoid duplicates
        
        // Start countdown
        startCountdown();
    }
    
    private void setupWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        
        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK | 
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "nomisafe:sosalert"
            );
            wakeLock.acquire(60000); // 60 seconds max
        }
    }
    
    private View createContentView() {
        // Create a full-screen red layout programmatically
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setBackgroundColor(0xFFDC2626); // Red background
        layout.setPadding(60, 60, 60, 60);
        
        // Warning icon
        TextView warningIcon = new TextView(this);
        warningIcon.setText("⚠️");
        warningIcon.setTextSize(80);
        warningIcon.setGravity(android.view.Gravity.CENTER);
        layout.addView(warningIcon);
        
        // Spacer
        View spacer1 = new View(this);
        spacer1.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 40));
        layout.addView(spacer1);
        
        // Title
        TextView title = new TextView(this);
        title.setText("Fall Detected!");
        title.setTextSize(36);
        title.setTextColor(0xFFFFFFFF);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(android.view.Gravity.CENTER);
        layout.addView(title);
        
        // Subtitle
        TextView subtitle = new TextView(this);
        subtitle.setText("Are you okay?");
        subtitle.setTextSize(24);
        subtitle.setTextColor(0xFFFEE2E2);
        subtitle.setGravity(android.view.Gravity.CENTER);
        layout.addView(subtitle);
        
        // Spacer
        View spacer2 = new View(this);
        spacer2.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 60));
        layout.addView(spacer2);
        
        // Countdown circle container
        android.widget.FrameLayout circleContainer = new android.widget.FrameLayout(this);
        android.widget.LinearLayout.LayoutParams circleParams = new android.widget.LinearLayout.LayoutParams(300, 300);
        circleParams.gravity = android.view.Gravity.CENTER;
        circleContainer.setLayoutParams(circleParams);
        
        // Progress bar (circular)
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(false);
        progressBar.setMax(COUNTDOWN_SECONDS);
        progressBar.setProgress(COUNTDOWN_SECONDS);
        android.widget.FrameLayout.LayoutParams progressParams = new android.widget.FrameLayout.LayoutParams(
            android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
            android.widget.FrameLayout.LayoutParams.MATCH_PARENT
        );
        progressBar.setLayoutParams(progressParams);
        circleContainer.addView(progressBar);
        
        // Countdown text
        countdownText = new TextView(this);
        countdownText.setText(String.valueOf(COUNTDOWN_SECONDS));
        countdownText.setTextSize(72);
        countdownText.setTextColor(0xFFFFFFFF);
        countdownText.setTypeface(null, android.graphics.Typeface.BOLD);
        countdownText.setGravity(android.view.Gravity.CENTER);
        android.widget.FrameLayout.LayoutParams textParams = new android.widget.FrameLayout.LayoutParams(
            android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
            android.widget.FrameLayout.LayoutParams.MATCH_PARENT
        );
        countdownText.setLayoutParams(textParams);
        circleContainer.addView(countdownText);
        
        layout.addView(circleContainer);
        
        // Spacer
        View spacer3 = new View(this);
        spacer3.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 40));
        layout.addView(spacer3);
        
        // Message
        TextView message = new TextView(this);
        message.setText("If you don't respond, we'll notify your emergency contacts.");
        message.setTextSize(18);
        message.setTextColor(0xFFFEE2E2);
        message.setGravity(android.view.Gravity.CENTER);
        message.setPadding(20, 0, 20, 0);
        layout.addView(message);
        
        // Spacer
        View spacer4 = new View(this);
        spacer4.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 60));
        layout.addView(spacer4);
        
        // Cancel button
        cancelButton = new Button(this);
        cancelButton.setText("I'm Okay - Cancel SOS");
        cancelButton.setTextSize(20);
        cancelButton.setTextColor(0xFFDC2626);
        cancelButton.setBackgroundColor(0xFFFFFFFF);
        cancelButton.setPadding(80, 40, 80, 40);
        cancelButton.setOnClickListener(v -> cancelSOS());
        android.widget.LinearLayout.LayoutParams buttonParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        buttonParams.gravity = android.view.Gravity.CENTER;
        cancelButton.setLayoutParams(buttonParams);
        layout.addView(cancelButton);
        
        // Secondary text
        View spacer5 = new View(this);
        spacer5.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 30));
        layout.addView(spacer5);
        
        TextView secondary = new TextView(this);
        secondary.setText("Tap the button above if this was a false alarm");
        secondary.setTextSize(14);
        secondary.setTextColor(0xFFFCA5A5);
        secondary.setGravity(android.view.Gravity.CENTER);
        layout.addView(secondary);
        
        return layout;
    }
    
    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 500, 200, 500, 200, 500};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = repeat from start
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }
    
    private void playAlertSound() {
        // Try to use MediaPlayer with alarm sound for continuous looping
        try {
            // Get the default alarm sound URI
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            
            if (alarmUri != null) {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(this, alarmUri);
                
                // Set audio attributes for alarm stream
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    mediaPlayer.setAudioAttributes(audioAttributes);
                } else {
                    mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                }
                
                // Set to loop continuously
                mediaPlayer.setLooping(true);
                mediaPlayer.setVolume(1.0f, 1.0f);  // Max volume
                mediaPlayer.prepare();
                mediaPlayer.start();
                Log.i(TAG, "Started continuous alarm sound with MediaPlayer");
            } else {
                // Fallback to ToneGenerator if no alarm URI available
                startToneGeneratorLoop();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start MediaPlayer alarm, falling back to ToneGenerator", e);
            startToneGeneratorLoop();
        }
    }
    
    private void startToneGeneratorLoop() {
        // Fallback: Use ToneGenerator in a loop
        try {
            toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            // Start a repeating tone using handler
            handler.post(new Runnable() {
                @Override
                public void run() {
                    if (!isCancelled && toneGenerator != null) {
                        toneGenerator.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 1000);
                        handler.postDelayed(this, 1500); // Repeat every 1.5 seconds
                    }
                }
            });
            Log.i(TAG, "Started ToneGenerator loop as fallback");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ToneGenerator", e);
        }
    }
    
    private void stopAlertSound() {
        // Stop MediaPlayer
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.i(TAG, "Stopped MediaPlayer alarm");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping MediaPlayer", e);
            }
        }
        
        // Stop ToneGenerator
        if (toneGenerator != null) {
            try {
                toneGenerator.stopTone();
                toneGenerator.release();
                toneGenerator = null;
                Log.i(TAG, "Stopped ToneGenerator");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping ToneGenerator", e);
            }
        }
    }
    
    private void startCountdown() {
        handler.post(new Runnable() {
            @Override
            public void run() {
                if (isCancelled) return;
                
                if (secondsRemaining > 0) {
                    countdownText.setText(String.valueOf(secondsRemaining));
                    progressBar.setProgress(secondsRemaining);
                    secondsRemaining--;
                    handler.postDelayed(this, 1000);
                } else {
                    // Time's up - send SOS
                    sendSOS();
                }
            }
        });
    }
    
    private void cancelSOS() {
        Log.i(TAG, "SOS Cancelled by user");
        isCancelled = true;
        FallDetectionService.sosCancelled = true;
        FallDetectionService.sosTimerActive = false;
        
        // Note: Sound and vibration are stopped in FallDetectionService via broadcast
        
        // Cancel the notification
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(2); // SOS notification ID
        }
        
        // Broadcast cancel intent to stop sound/vibration in the service
        Intent cancelIntent = new Intent(FallDetectionService.ACTION_CANCEL_SOS);
        cancelIntent.setPackage(getPackageName());
        sendBroadcast(cancelIntent);
        
        // Show confirmation briefly then close
        countdownText.setText("✓");
        countdownText.setTextSize(60);
        ((TextView) ((android.widget.LinearLayout) countdownText.getParent().getParent()).getChildAt(2)).setText("SOS Cancelled");
        ((TextView) ((android.widget.LinearLayout) countdownText.getParent().getParent()).getChildAt(3)).setText("Glad you're okay!");
        cancelButton.setVisibility(View.GONE);
        
        handler.postDelayed(() -> finish(), 2000);
    }
    
    private void sendSOS() {
        Log.i(TAG, "SOS sent to nominees");
        FallDetectionService.sosTimerActive = false;
        
        // Note: Sound and vibration are stopped in FallDetectionService
        
        // Update UI to show SOS was sent
        countdownText.setText("📤");
        countdownText.setTextSize(60);
        ((TextView) ((android.widget.LinearLayout) countdownText.getParent().getParent()).getChildAt(2)).setText("SOS Alert Sent");
        ((TextView) ((android.widget.LinearLayout) countdownText.getParent().getParent()).getChildAt(3)).setText("Your emergency contacts have been notified.");
        cancelButton.setVisibility(View.GONE);
        
        // Show notification that SOS was sent
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(2); // Cancel countdown notification
        }
        
        // TODO: Make API call to actually notify nominees
        
        handler.postDelayed(() -> finish(), 3000);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        isCancelled = true;  // Stop any loops
        handler.removeCallbacksAndMessages(null);
        
        // Note: Sound and vibration are managed by FallDetectionService
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        // Reset the timer active flag
        FallDetectionService.sosTimerActive = false;
    }
    
    @Override
    public void onBackPressed() {
        // Prevent back press from dismissing - user must tap cancel
    }
}
