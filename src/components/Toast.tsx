import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Toast as ToastItem, ToastType } from '@/hooks/useToast';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg animate-slide-in-right min-w-[280px] max-w-[420px] ${styleMap[toast.type]}`}
          >
            <Icon size={18} className={`flex-shrink-0 ${iconColorMap[toast.type]}`} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
