import { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';

type ToastMessage = {
  id: number;
  text: string;
  tone: 'success' | 'error' | 'info';
};

type ToastContextValue = {
  pushToast: (text: string, tone?: ToastMessage['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast: (text, tone = 'info') => {
        const id = Date.now();
        setToasts((current) => [...current, { id, text, tone }]);
        setTimeout(() => {
          setToasts((current) => current.filter((message) => message.id !== id));
        }, 2600);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex max-w-sm flex-col gap-2 px-3 safe-top">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'glass-panel rounded-2xl px-3 py-2 text-sm font-medium',
              toast.tone === 'success' && 'border-brand-500 text-brand-900',
              toast.tone === 'error' && 'border-brand-900 bg-brand-900/90 text-text-invert',
              toast.tone === 'info' && 'text-brand-900',
            )}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
