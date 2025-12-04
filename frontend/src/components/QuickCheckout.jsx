import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, Package, Calendar, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '../lib/utils';

const QuickCheckout = ({ isOpen, onClose, preselectedItem = null }) => {
    const [step, setStep] = useState('search'); // search, select-copy, confirm, success
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCopy, setSelectedCopy] = useState(null);
    const [availableCopies, setAvailableCopies] = useState([]);
    const [checkoutResult, setCheckoutResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (preselectedItem) {
                handleSelect(preselectedItem);
            } else {
                setStep('search');
                setSearchQuery('');
                setSearchResults([]);
                setSelectedItem(null);
            }
            setCheckoutResult(null);
            setError(null);
            setSelectedCopy(null);
            setAvailableCopies([]);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, preselectedItem]);

    // Debounced search
    useEffect(() => {
        if (step !== 'search' || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get('/inventory/', { params: { search: searchQuery, availability: 'available' } });
                setSearchResults(res.data.slice(0, 5)); // Limit to 5
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, step]);

    const handleSelect = async (item) => {
        setSelectedItem(item);
        setLoading(true);
        try {
            // Fetch copies
            const res = await api.get(`/inventory/${item.id}/copies`, { params: { status: 'AVAILABLE' } });
            const copies = res.data;
            if (copies.length > 0) {
                setAvailableCopies(copies);
                setStep('select-copy');
            } else {
                // No specific copies tracked (legacy), proceed to confirm
                setStep('confirm');
            }
        } catch (err) {
            console.error("Failed to fetch copies", err);
            // Fallback to confirm if fetch fails (maybe legacy item)
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    const handleCopySelect = (copy) => {
        setSelectedCopy(copy);
        setStep('confirm');
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                item_id: selectedItem.id,
                acc_no: selectedCopy ? selectedCopy.acc_no : null
            };
            const res = await api.post('/transactions/request', payload);
            setCheckoutResult(res.data);
            setStep('success');
        } catch (err) {
            setError(err.response?.data?.error || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        onClose();
        setTimeout(() => {
            setStep('search');
            setSelectedItem(null);
            setSelectedCopy(null);
            setCheckoutResult(null);
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal Content - Top aligned on mobile, centered on desktop */}
            <div className={cn(
                "w-full bg-white shadow-2xl flex flex-col transition-all duration-300",
                "fixed top-0 left-0 right-0 z-50", // Fixed at top on mobile
                "rounded-b-3xl min-h-[30vh]", // Mobile styling
                "sm:relative sm:inset-auto sm:z-auto sm:rounded-2xl sm:max-w-lg sm:max-h-[85vh] sm:min-h-0", // Desktop reset
                "animate-in slide-in-from-top-10 fade-in"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">
                        {step === 'search' ? "Find Item" :
                            step === 'select-copy' ? "Select Copy" :
                                step === 'confirm' ? "Confirm Checkout" : "Success"}
                    </h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto max-h-[60vh] sm:max-h-[60vh]">
                    {step === 'search' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Search by name, ID, or type..."
                                    className="pl-10 py-6 text-lg bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 min-h-[100px]">
                                {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600 w-6 h-6" /></div>}

                                {!loading && searchResults.length === 0 && searchQuery && (
                                    <div className="text-center text-gray-500 py-8">No items found.</div>
                                )}

                                {searchResults.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all group"
                                    >
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-indigo-100">
                                            <Package className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                                            <p className="text-xs text-gray-500">{item.type} • {item.quantity_available} available</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-indigo-600">Select</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'select-copy' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Select a specific copy to checkout:</p>
                            <div className="space-y-2">
                                {availableCopies.map(copy => (
                                    <div
                                        key={copy.id}
                                        onClick={() => handleCopySelect(copy)}
                                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all"
                                    >
                                        <span className="font-mono font-medium text-gray-900">{copy.acc_no}</span>
                                        <Button size="sm" variant="outline">Select</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && selectedItem && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Package className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{selectedItem.title}</h3>
                                    <p className="text-sm text-gray-500">{selectedItem.type}</p>
                                    {selectedCopy && (
                                        <p className="text-xs font-mono text-indigo-600 mt-1 bg-indigo-50 inline-block px-2 py-1 rounded">
                                            Copy: {selectedCopy.acc_no}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-200">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">Due Date</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {format(addDays(new Date(), 14), 'MMM d, yyyy')}
                                </span>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && checkoutResult && (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {checkoutResult.status === 'ISSUED' ? 'Checkout Complete!' : 'Request Sent!'}
                                </h3>
                                <p className="text-gray-500 mt-2">
                                    {checkoutResult.status === 'ISSUED'
                                        ? `Please return by ${format(new Date(checkoutResult.due_date), 'PPP')}`
                                        : 'Your request has been sent to the staff for approval.'}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Transaction ID</p>
                                <p className="font-mono text-lg font-medium text-gray-900">{checkoutResult.transaction_id}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl sm:rounded-b-2xl">
                    {step === 'select-copy' && (
                        <Button variant="outline" className="w-full py-6" onClick={() => setStep('search')}>
                            Back
                        </Button>
                    )}
                    {step === 'confirm' && selectedItem && (
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 py-6" onClick={() => setStep(availableCopies.length > 0 ? 'select-copy' : 'search')}>
                                Back
                            </Button>
                            <Button
                                className="flex-1 py-6 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                onClick={handleCheckout}
                                isLoading={loading}
                                disabled={selectedItem.quantity_available < 1}
                            >
                                {selectedItem.quantity_available > 0 ? 'Confirm' : 'Join Waitlist'}
                            </Button>
                        </div>
                    )}
                    {step === 'success' && (
                        <Button className="w-full py-6 text-lg" onClick={reset}>
                            Done
                        </Button>
                    )}
                    {step === 'search' && (
                        <p className="text-center text-xs text-gray-400">
                            Search for an item to begin checkout
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickCheckout;
