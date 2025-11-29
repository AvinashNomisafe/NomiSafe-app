import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  fallDetectionService,
  FallEvent,
} from '../services/FallDetectionService';

interface FallDetectionContextType {
  isMonitoring: boolean;
  isAlertActive: boolean;
  currentEvent: FallEvent | null;
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => Promise<boolean>;
  cancelAlert: () => Promise<void>;
}

const FallDetectionContext = createContext<
  FallDetectionContextType | undefined
>(undefined);

export const FallDetectionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<FallEvent | null>(null);

  useEffect(() => {
    // Check if monitoring was enabled on app start
    checkMonitoringStatus();
  }, []);

  const checkMonitoringStatus = async () => {
    const monitoring = await fallDetectionService.isMonitoring();
    if (monitoring) {
      await startMonitoring();
    }
  };

  const startMonitoring = async (): Promise<boolean> => {
    const success = await fallDetectionService.start({
      onFall: event => {
        setIsAlertActive(true);
        setCurrentEvent(event);
      },
      onCancel: () => {
        setIsAlertActive(false);
        setCurrentEvent(null);
      },
      onSendAlerts: () => {
        // Handle alert sent
        setIsAlertActive(false);
      },
    });

    if (success) {
      setIsMonitoring(true);
    }

    return success;
  };

  const stopMonitoring = async (): Promise<boolean> => {
    const success = await fallDetectionService.stop();

    if (success) {
      setIsMonitoring(false);
      setIsAlertActive(false);
      setCurrentEvent(null);
    }

    return success;
  };

  const cancelAlert = async (): Promise<void> => {
    await fallDetectionService.cancelAlert();
    setIsAlertActive(false);
    setCurrentEvent(null);
  };

  return (
    <FallDetectionContext.Provider
      value={{
        isMonitoring,
        isAlertActive,
        currentEvent,
        startMonitoring,
        stopMonitoring,
        cancelAlert,
      }}
    >
      {children}
    </FallDetectionContext.Provider>
  );
};

export const useFallDetection = () => {
  const context = useContext(FallDetectionContext);
  if (context === undefined) {
    throw new Error(
      'useFallDetection must be used within a FallDetectionProvider',
    );
  }
  return context;
};
