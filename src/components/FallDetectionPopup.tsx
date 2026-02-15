import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  NativeModules,
  Animated,
  Vibration,
  Dimensions,
  Platform,
  DeviceEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import { sendSOSAlert } from '../services/sos';

// Optional: geolocation fallback (install @react-native-community/geolocation if you want JS fallback)
let Geolocation: any = null;
try {
  Geolocation = require('@react-native-community/geolocation').default;
} catch (e) {
  // Geolocation package not installed - native service will handle location
}

const { FallDetectionModule } = NativeModules;
const { width } = Dimensions.get('window');

interface FallDetectionPopupProps {
  onSOSSent?: () => void;
  onSOSCancelled?: () => void;
}

export interface FallDetectionPopupRef {
  showPopup: () => void;
  hidePopup: () => void;
}

const FallDetectionPopup = forwardRef<
  FallDetectionPopupRef,
  FallDetectionPopupProps
>(({ onSOSSent, onSOSCancelled }, ref) => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [status, setStatus] = useState<'countdown' | 'sent' | 'cancelled'>(
    'countdown',
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    showPopup: () => {
      setVisible(true);
      setCountdown(30);
      setStatus('countdown');
      progressAnim.setValue(0);
      startPulseAnimation();
    },
    hidePopup: () => {
      setVisible(false);
      setStatus('countdown');
    },
  }));

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    console.log('[FallDetectionPopup] Setting up event listeners');

    // Use DeviceEventEmitter directly for better compatibility
    const fallDetectedSub = DeviceEventEmitter.addListener(
      'FallDetected',
      event => {
        console.log('[FallDetectionPopup] FallDetected event received:', event);
        setVisible(true);
        setCountdown(event?.countdown || 30);
        setStatus('countdown');
        progressAnim.setValue(0);

        // Vibrate to alert user
        Vibration.vibrate([0, 500, 200, 500, 200, 500], true);

        // Start pulse animation
        startPulseAnimation();
      },
    );

    // Listen for countdown updates
    const countdownSub = DeviceEventEmitter.addListener(
      'SOSCountdown',
      event => {
        const remaining = event?.secondsRemaining || 0;
        setCountdown(remaining);
        progressAnim.setValue((30 - remaining) / 30);
      },
    );

    // Listen for SOS cancelled
    const cancelledSub = DeviceEventEmitter.addListener('SOSCancelled', () => {
      console.log('[FallDetectionPopup] SOSCancelled event received');
      Vibration.cancel();
      setStatus('cancelled');
      setTimeout(() => {
        setVisible(false);
        setStatus('countdown');
        onSOSCancelled?.();
      }, 2000);
    });

    // Listen for SOS sent
    const sentSub = DeviceEventEmitter.addListener('SOSSent', async event => {
      console.log('[FallDetectionPopup] SOSSent event received:', JSON.stringify(event));
      Vibration.cancel();
      setStatus('sent');

      // Send SOS alert to backend API
      const latitude = event?.latitude;
      const longitude = event?.longitude;
      const accuracy = event?.accuracy;

      if (latitude != null && longitude != null) {
        console.log('=== SOS SENT WITH LOCATION ===');
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        console.log('Accuracy:', accuracy);
        console.log('==============================');

        // Call API to notify emergency contacts
        try {
          const response = await sendSOSAlert({
            latitude,
            longitude,
            accuracy,
          });
          console.log('=== SOS API RESPONSE ===');
          console.log('Contacts notified:', response.contacts_notified);
          console.log('Maps link:', response.location?.maps_link);
          if (response.failed_contacts?.length > 0) {
            console.log('Failed contacts:', response.failed_contacts);
          }
          console.log('========================');
        } catch (error: any) {
          console.error('Failed to send SOS to API:', error.message);
        }
      } else {
        console.log('=== SOS SENT (NO LOCATION FROM NATIVE) ===');
        // Try to get location from JS side as fallback
        if (Geolocation) {
          Geolocation.getCurrentPosition(
            async (position: any) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const acc = position.coords.accuracy;
              console.log('Fallback Location from JS:');
              console.log('Latitude:', lat);
              console.log('Longitude:', lng);
              console.log('Accuracy:', acc);

              // Call API with fallback location
              try {
                const response = await sendSOSAlert({
                  latitude: lat,
                  longitude: lng,
                  accuracy: acc,
                });
                console.log('SOS API Response (fallback):', response);
              } catch (error: any) {
                console.error('Failed to send SOS to API:', error.message);
              }
            },
            (error: any) => {
              console.log('Could not get location:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
          );
        } else {
          console.log(
            'Geolocation package not installed - no JS fallback available',
          );
        }
      }

      setTimeout(() => {
        setVisible(false);
        setStatus('countdown');
        onSOSSent?.();
      }, 3000);
    });

    return () => {
      fallDetectedSub.remove();
      countdownSub.remove();
      cancelledSub.remove();
      sentSub.remove();
    };
  }, [onSOSSent, onSOSCancelled]);

  const handleCancel = () => {
    // Call native module to cancel SOS
    if (FallDetectionModule && FallDetectionModule.cancelSOS) {
      FallDetectionModule.cancelSOS();
    }
    Vibration.cancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {status === 'countdown' && (
          <>
            {/* Warning Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.warningIcon}>⚠️</Text>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>Fall Detected!</Text>
            <Text style={styles.subtitle}>Are you okay?</Text>

            {/* Countdown Circle */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownLabel}>seconds</Text>
              </View>
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Message */}
            <Text style={styles.message}>
              If you don't respond, we'll notify your First Connect contacts in{' '}
              <Text style={styles.boldText}>{countdown} seconds</Text>.
            </Text>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>I'm Okay - Cancel SOS</Text>
            </TouchableOpacity>

            {/* Secondary info */}
            <Text style={styles.secondaryText}>
              Tap the button above if this was a false alarm
            </Text>
          </>
        )}

        {status === 'cancelled' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusTitle}>SOS Cancelled</Text>
            <Text style={styles.statusMessage}>
              Glad you're okay! No alerts were sent.
            </Text>
          </View>
        )}

        {status === 'sent' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>📤</Text>
            <Text style={styles.statusTitle}>SOS Alert Sent</Text>
            <Text style={styles.statusMessage}>
              Your emergency contacts have been notified about your fall.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#FEE2E2',
    textAlign: 'center',
    marginBottom: 30,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  countdownCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#FEE2E2',
    marginTop: -5,
  },
  progressBarContainer: {
    width: width - 60,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  message: {
    fontSize: 18,
    color: '#FEE2E2',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  secondaryText: {
    fontSize: 14,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  statusMessage: {
    fontSize: 18,
    color: '#FEE2E2',
    textAlign: 'center',
    lineHeight: 26,
  },
});

export default FallDetectionPopup;
