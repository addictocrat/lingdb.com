'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils/cn';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-accent-500" />,
  info: <Info className="h-5 w-5 text-primary-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

const bgStyles: Record<ToastVariant, string> = {
  success: 'border-green-200 dark:border-green-800',
  error: 'border-accent-200 dark:border-accent-800',
  info: 'border-primary-200 dark:border-primary-800',
  warning: 'border-yellow-200 dark:border-yellow-800',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-[var(--bg)] px-4 py-3 shadow-lg animate-in slide-in-from-right fade-in duration-300',
              bgStyles[t.variant]
            )}
          >
            {icons[t.variant]}
            <p className="text-lg font-medium">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 rounded-md p-1 text-[var(--fg)]/40 hover:text-[var(--fg)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
