import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MaxRenewalCard = ({ transactions }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        // Check for items with max renewals (assuming max is 2 for now, ideally fetch from settings)
        // We can check if status is ISSUED and renewal_count >= 2
        const maxRenewals = 2; // Hardcoded for now, or pass as prop
        const riskyItems = transactions.filter(tx =>
            tx.status === 'ISSUED' && (tx.renewal_count || 0) >= maxRenewals
        );

        if (riskyItems.length > 0) {
            setItems(riskyItems);
            // Check if already dismissed in this session? Or just show always?
            // Let's show if not dismissed recently
            const lastDismissed = localStorage.getItem('maxRenewalDismissed');
            if (!lastDismissed || new Date().getTime() - parseInt(lastDismissed) > 3600000) { // 1 hour
                setIsVisible(true);
            }
        }
    }, [transactions]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('maxRenewalDismissed', new Date().getTime().toString());
    };

    if (!isVisible || items.length === 0) return null;

    return (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-right-full duration-500">
            <div className="bg-white rounded-xl shadow-2xl border-l-4 border-l-amber-500 p-4 max-w-sm w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Renewal Limit Reached</h4>
                        <p className="text-xs text-gray-600 mt-1 mb-2">
                            You have {items.length} item{items.length > 1 ? 's' : ''} that cannot be renewed further. Please return {items.length > 1 ? 'them' : 'it'} by the due date.
                        </p>
                        <div className="space-y-1 mb-3">
                            {items.slice(0, 2).map(item => (
                                <div key={item.id} className="text-xs font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate">
                                    {item.item_title}
                                </div>
                            ))}
                            {items.length > 2 && (
                                <div className="text-[10px] text-gray-500 italic">
                                    + {items.length - 2} more
                                </div>
                            )}
                        </div>
                        <Link
                            to="/my-borrowings"
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                        >
                            View Items <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaxRenewalCard;
