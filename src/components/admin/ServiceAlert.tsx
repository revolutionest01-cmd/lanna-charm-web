import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AlertType = 'error' | 'warning' | 'success' | 'info';

export interface ServiceAlertMessage {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  autoClose?: boolean;
  closeDuration?: number; // milliseconds
}

interface ServiceAlertProps {
  alerts: ServiceAlertMessage[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const AlertIcon = ({ type }: { type: AlertType }) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
  }
};

const getAlertStyles = (type: AlertType) => {
  switch (type) {
    case 'error':
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900';
    case 'success':
      return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';
    default:
      return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
  }
};

const getTitleStyles = (type: AlertType) => {
  switch (type) {
    case 'error':
      return 'text-red-900 dark:text-red-100';
    case 'warning':
      return 'text-amber-900 dark:text-amber-100';
    case 'success':
      return 'text-green-900 dark:text-green-100';
    default:
      return 'text-blue-900 dark:text-blue-100';
  }
};

const getMessageStyles = (type: AlertType) => {
  switch (type) {
    case 'error':
      return 'text-red-800 dark:text-red-200';
    case 'warning':
      return 'text-amber-800 dark:text-amber-200';
    case 'success':
      return 'text-green-800 dark:text-green-200';
    default:
      return 'text-blue-800 dark:text-blue-200';
  }
};

export const ServiceAlert = ({ alerts, onDismiss, onDismissAll }: ServiceAlertProps) => {
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    alerts.forEach((alert) => {
      if (alert.autoClose && alert.closeDuration) {
        const timer = setTimeout(() => {
          onDismiss(alert.id);
        }, alert.closeDuration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [alerts, onDismiss]);

  if (alerts.length === 0) return null;

  // Show only the most recent error alert when multiple alerts exist
  const displayAlert = alerts[0];

  const alertContent = (
    <>
      {/* Backdrop for Error Alerts */}
      {displayAlert && displayAlert.type === 'error' && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={() => {
            // Allow clicking backdrop to dismiss on mobile
          }}
        />
      )}

      {/* Alert Container - Center of Screen */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        {displayAlert && (
          <div
            key={displayAlert.id}
            className={cn(
              'border rounded-lg p-6 shadow-2xl backdrop-blur-sm w-full max-w-lg pointer-events-auto',
              'animated-in fade-in zoom-in-95 duration-300',
              getAlertStyles(displayAlert.type)
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <AlertIcon type={displayAlert.type} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn('font-bold text-base', getTitleStyles(displayAlert.type))}>
                  {displayAlert.title}
                </h3>
                <p className={cn('text-sm mt-2 leading-relaxed', getMessageStyles(displayAlert.type))}>
                  {displayAlert.message}
                </p>
                {displayAlert.details && (
                  <details className="mt-4 cursor-pointer">
                    <summary className={cn('text-xs font-bold hover:underline', getTitleStyles(displayAlert.type))}>
                      📋 {typeof displayAlert.details === 'string' && displayAlert.details.startsWith('[') ? 'ดูรายละเอียด' : 'ดูข้อมูลเพิ่มเติม'}
                    </summary>
                    <pre className={cn(
                      'mt-3 p-3 rounded text-xs overflow-auto max-h-48 bg-black/20 dark:bg-white/10',
                      getMessageStyles(displayAlert.type)
                    )}>
                      {typeof displayAlert.details === 'string' ? displayAlert.details : JSON.stringify(displayAlert.details, null, 2)}
                    </pre>
                  </details>
                )}
                <div className="flex items-center gap-2 mt-4 text-xs">
                  <time className={cn(getTitleStyles(displayAlert.type))}>
                    {displayAlert.timestamp.toLocaleTimeString('th-TH')}
                  </time>
                </div>
              </div>
              <button
                onClick={() => onDismiss(displayAlert.id)}
                className={cn(
                  'flex-shrink-0 p-2 rounded-full hover:bg-black/30 dark:hover:bg-white/30 transition-colors duration-200',
                  getTitleStyles(displayAlert.type)
                )}
                title={displayAlert.type === 'error' ? 'ปิด Error' : 'ปิด'}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant={displayAlert.type === 'error' ? 'destructive' : 'outline'}
                onClick={() => onDismiss(displayAlert.id)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {displayAlert.type === 'error' ? 'ปิด' : 'โอเค'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(alertContent, document.body);
};
