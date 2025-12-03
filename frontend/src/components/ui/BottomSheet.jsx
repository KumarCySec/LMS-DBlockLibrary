import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className={cn(
                "relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-xl transition-transform transform duration-300 ease-out max-h-[90vh] flex flex-col",
                "animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
