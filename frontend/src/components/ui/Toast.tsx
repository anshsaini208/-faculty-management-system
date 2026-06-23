import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, type, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, description, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => toast({ title, description, type: 'success' }), [toast]);
  const error = useCallback((title: string, description?: string) => toast({ title, description, type: 'error' }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast({ title, description, type: 'warning' }), [toast]);
  const info = useCallback((title: string, description?: string) => toast({ title, description, type: 'info' }), [toast]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
  };

  const borders = {
    success: 'border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
    error: 'border-rose-100 dark:border-rose-950/50 bg-rose-50/90 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300',
    warning: 'border-amber-100 dark:border-amber-950/50 bg-amber-50/90 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
    info: 'border-blue-100 dark:border-blue-950/50 bg-blue-50/90 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300'
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${borders[t.type]}`}
            >
              <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold tracking-tight">{t.title}</h4>
                {t.description && (
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
