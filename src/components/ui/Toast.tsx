import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast as ToastType, type ToastVariant } from '@/stores/toastStore';

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; bgColor: string; iconColor: string; borderColor: string }
> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-900/90',
    iconColor: 'text-green-400',
    borderColor: 'border-green-700',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-900/90',
    iconColor: 'text-red-400',
    borderColor: 'border-red-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-900/90',
    iconColor: 'text-yellow-400',
    borderColor: 'border-yellow-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-900/90',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-700',
  },
};

interface ToastProps {
  toast: ToastType;
}

function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 150);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        ${config.bgColor} ${config.borderColor}
        border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md
        flex items-start gap-3
        transition-all duration-150 ease-out
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-100">{toast.title}</p>
        {toast.message && <p className="text-sm text-slate-300 mt-0.5">{toast.message}</p>}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className="mt-2 text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-200 p-0.5 -m-0.5 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
