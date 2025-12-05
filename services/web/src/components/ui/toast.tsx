'use client';

import * as React from 'react';
import { X, PartyPopper, Siren, Lightbulb, HardHat } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastData = {
  message: string;
  type: ToastType;
};

const variants = {
  success: {
    container: 'bg-green-50 border-green-400',
    icon: <PartyPopper className="h-5 w-5 text-green-500" />,
    titleColor: 'text-green-800',
    messageColor: 'text-green-700',
    title: 'Hooray!',
  },
  error: {
    container: 'bg-red-50 border-red-400',
    icon: <Siren className="h-5 w-5 text-red-500" />,
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
    title: 'Uh oh!',
  },
  warning: {
    container: 'bg-amber-50 border-amber-400',
    icon: <HardHat className="h-5 w-5 text-amber-500" />,
    titleColor: 'text-amber-800',
    messageColor: 'text-amber-700',
    title: 'Heads up!',
  },
  info: {
    container: 'bg-blue-50 border-blue-400',
    icon: <Lightbulb className="h-5 w-5 text-blue-500" />,
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
    title: 'Did you know?',
  },
};

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  const variant = variants[type];

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      className={`animate-in slide-in-from-right-full fade-in fixed top-4 right-4 z-50 flex w-full max-w-xs items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-md transition-all duration-300 ease-out ${variant.container} `}
    >
      <div className="flex-shrink-0 pt-0.5">{variant.icon}</div>
      <div className="flex-1 space-y-0.5">
        <h3 className={`text-sm font-bold ${variant.titleColor}`}>{variant.title}</h3>
        <p className={`text-xs leading-tight ${variant.messageColor}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`ml-auto inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md opacity-50 transition-colors hover:opacity-100 ${variant.titleColor}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastData | null>(null);

  const showToast = React.useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
