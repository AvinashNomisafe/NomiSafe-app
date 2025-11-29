import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Geolocation from '@react-native-community/geolocation';

const { FallDetection } = NativeModules;

interface FallEvent {
  impactG: number;
  timestamp: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

class FallDetectionService {
  private eventEmitter = new NativeEventEmitter(FallDetection);
  private listeners: any[] = [];
  private isEnabled = false;
  private countdownTimer?: NodeJS.Timeout;
  private alarmSound?: Sound;
  private onFallCallback?: (event: FallEvent) => void;
  private onCancelCallback?: () => void;
  private onSendAlertsCallback?: () => void;

  constructor() {
    this.initializeAlarmSound();
  }

  private initializeAlarmSound() {
    Sound.setCategory('Playback');
    // Using a system sound as fallback
    this.alarmSound = new Sound('sound_name.mp3', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.log('Failed to load alarm sound, will use default', error);
      }
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted['android.permission.BODY_SENSORS'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.POST_NOTIFICATIONS'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    // iOS handles permissions automatically through native module
    return true;
  }

  async start(callbacks: {
    onFall?: (event: FallEvent) => void;
    onCancel?: () => void;
    onSendAlerts?: () => void;
  }): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      this.onFallCallback = callbacks.onFall;
      this.onCancelCallback = callbacks.onCancel;
      this.onSendAlertsCallback = callbacks.onSendAlerts;

      this.setupEventListeners();
      await FallDetection.startMonitoring();

      this.isEnabled = true;
      await AsyncStorage.setItem('fall_detection_enabled', 'true');

      return true;
    } catch (error) {
      console.error('Failed to start fall detection:', error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    try {
      await FallDetection.stopMonitoring();
      this.removeEventListeners();
      this.isEnabled = false;
      await AsyncStorage.setItem('fall_detection_enabled', 'false');
      return true;
    } catch (error) {
      console.error('Failed to stop fall detection:', error);
      return false;
    }
  }

  async isMonitoring(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('fall_detection_enabled');
    return enabled === 'true';
  }

  private setupEventListeners() {
    // Fall detected event
    const fallListener = this.eventEmitter.addListener(
      'onFallDetected',
      (event: FallEvent) => {
        this.handleFallDetected(event);
      },
    );

    // Fall cancelled event
    const cancelListener = this.eventEmitter.addListener(
      'onFallCancelled',
      () => {
        this.handleFallCancelled();
      },
    );

    // Send emergency alerts event
    const alertsListener = this.eventEmitter.addListener(
      'onSendEmergencyAlerts',
      () => {
        this.handleSendEmergencyAlerts();
      },
    );

    this.listeners = [fallListener, cancelListener, alertsListener];
  }

  private removeEventListeners() {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }

  private handleFallDetected(event: FallEvent) {
    console.log('Fall detected:', event);

    // Trigger haptic feedback
    ReactNativeHapticFeedback.trigger('notificationWarning', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    // Start countdown
    this.startCountdown(30);

    // Notify callback
    this.onFallCallback?.(event);
  }

  private handleFallCancelled() {
    console.log('Fall alert cancelled');

    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = undefined;
    }

    this.alarmSound?.stop();

    this.onCancelCallback?.();
  }

  private async handleSendEmergencyAlerts() {
    console.log('Sending emergency alerts');

    try {
      const contacts = await this.getEmergencyContacts();
      const location = await this.getCurrentLocation();

      // Send SMS to contacts
      await this.sendSMSToContacts(contacts, location);

      // Play loud alarm
      this.playAlarm();

      this.onSendAlertsCallback?.();
    } catch (error) {
      console.error('Failed to send emergency alerts:', error);
    }
  }

  private startCountdown(seconds: number) {
    let remaining = seconds;

    const updateCountdown = () => {
      console.log(`Emergency alert in ${remaining} seconds`);

      // Progressive haptic feedback
      if (remaining <= 10) {
        ReactNativeHapticFeedback.trigger('impactHeavy');
      }

      // Start alarm at 20 seconds
      if (remaining === 20) {
        this.playAlarm();
      }

      remaining--;

      if (remaining > 0) {
        this.countdownTimer = setTimeout(updateCountdown, 1000);
      } else {
        this.handleSendEmergencyAlerts();
      }
    };

    updateCountdown();
  }

  private playAlarm() {
    if (this.alarmSound && this.alarmSound.isLoaded()) {
      this.alarmSound.setVolume(1.0);
      this.alarmSound.setNumberOfLoops(-1); // Loop indefinitely
      this.alarmSound.play(success => {
        if (!success) {
          console.log('Alarm sound playback failed');
        }
      });
    } else {
      // Use system vibration as fallback
      ReactNativeHapticFeedback.trigger('notificationError', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  }

  async cancelAlert(): Promise<void> {
    try {
      await FallDetection.cancelAlert();
      this.handleFallCancelled();
    } catch (error) {
      console.error('Failed to cancel alert:', error);
    }
  }

  private async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem('emergency_contacts');
      return contactsJson ? JSON.parse(contactsJson) : [];
    } catch (error) {
      console.error('Failed to get emergency contacts:', error);
      return [];
    }
  }

  private async getCurrentLocation(): Promise<Location | null> {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('Failed to get location:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  }

  private async sendSMSToContacts(
    contacts: EmergencyContact[],
    location: Location | null,
  ): Promise<void> {
    if (contacts.length === 0) {
      console.log('No emergency contacts configured');
      return;
    }

    const locationText = location
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : 'Location unavailable';

    const message = encodeURIComponent(
      `🚨 EMERGENCY: Fall detected! ${locationText}. Please check on me immediately.`,
    );

    for (const contact of contacts) {
      const phoneNumber = contact.phone.replace(/[^0-9+]/g, '');
      const smsUrl =
        Platform.OS === 'ios'
          ? `sms:${phoneNumber}&body=${message}`
          : `sms:${phoneNumber}?body=${message}`;

      try {
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
          // Small delay between opening SMS apps
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send SMS to ${contact.name}:`, error);
      }
    }
  }

  async saveEmergencyContact(contact: EmergencyContact): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const updated = [...contacts, contact];
      await AsyncStorage.setItem('emergency_contacts', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save emergency contact:', error);
      throw error;
    }
  }

  async removeEmergencyContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.getEmergencyContacts();
      const filtered = contacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(
        'emergency_contacts',
        JSON.stringify(filtered),
      );
    } catch (error) {
      console.error('Failed to remove emergency contact:', error);
      throw error;
    }
  }

  async getContacts(): Promise<EmergencyContact[]> {
    return this.getEmergencyContacts();
  }
}

export const fallDetectionService = new FallDetectionService();
export type { FallEvent, EmergencyContact, Location };
