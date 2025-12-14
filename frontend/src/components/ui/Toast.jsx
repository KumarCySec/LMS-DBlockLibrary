import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Toast = ({ id, message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-indigo-500" />
    };

    const styles = {
        success: 'border-emerald-200 bg-emerald-50',
        error: 'border-rose-200 bg-rose-50',
        warning: 'border-amber-200 bg-amber-50',
        info: 'border-indigo-200 bg-indigo-50'
    };

    return (
        <div className={cn(
            "flex items-start gap-4 p-4 rounded-xl shadow-lg border bg-white w-full animate-in slide-in-from-top-full duration-300",
            styles[type] || styles.info
        )}>
            <div className="shrink-0 mt-0.5">{icons[type] || icons.info}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-5">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none items-center w-full max-w-md">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto w-full px-4">
                    <Toast {...toast} onClose={removeToast} />
                </div>
            ))}
        </div>
    );
};
