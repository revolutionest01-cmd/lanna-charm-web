import { useState, useCallback } from 'react';
import { AlertType, ServiceAlertMessage } from '@/components/admin/ServiceAlert';

export const useServiceAlert = () => {
  const [alerts, setAlerts] = useState<ServiceAlertMessage[]>([]);

  const addAlert = useCallback(
    (
      type: AlertType,
      title: string,
      message: string,
      options?: {
        details?: string | Record<string, any>;
        autoClose?: boolean;
        closeDuration?: number;
      }
    ) => {
      const id = `alert-${Date.now()}-${Math.random()}`;
      const newAlert: ServiceAlertMessage = {
        id,
        type,
        title,
        message,
        details: options?.details as string | undefined,
        timestamp: new Date(),
        autoClose: options?.autoClose ?? true,
        closeDuration: options?.closeDuration ?? 5000,
      };

      setAlerts((prev) => [newAlert, ...prev]);
      return id;
    },
    []
  );

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const removeAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const error = useCallback(
    (title: string, message: string, details?: string | Record<string, any>) => {
      return addAlert('error', title, message, { details, autoClose: true, closeDuration: 10000 });
    },
    [addAlert]
  );

  const warning = useCallback(
    (title: string, message: string, details?: string | Record<string, any>) => {
      return addAlert('warning', title, message, { details, autoClose: true, closeDuration: 7000 });
    },
    [addAlert]
  );

  const success = useCallback(
    (title: string, message: string, details?: string | Record<string, any>) => {
      return addAlert('success', title, message, { details, autoClose: true, closeDuration: 3000 });
    },
    [addAlert]
  );

  const info = useCallback(
    (title: string, message: string, details?: string | Record<string, any>) => {
      return addAlert('info', title, message, { details, autoClose: true, closeDuration: 5000 });
    },
    [addAlert]
  );

  return {
    alerts,
    addAlert,
    removeAlert,
    removeAllAlerts,
    error,
    warning,
    success,
    info,
  };
};
