import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import BottomSheet from './ui/BottomSheet';
import { Search, Package, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

const QuickCheckout = ({ isOpen, onClose, preselectedItem = null }) => {
    const [step, setStep] = useState('search'); // search, confirm, success
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [checkoutResult, setCheckoutResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (preselectedItem) {
                setSelectedItem(preselectedItem);
                setStep('confirm');
            } else {
                setStep('search');
                setSearchQuery('');
                setSearchResults([]);
                setSelectedItem(null);
            }
            setCheckoutResult(null);
            setError(null);
        }
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
                const res = await api.get('/inventory/', { params: { search: searchQuery } });
                setSearchResults(res.data.slice(0, 5)); // Limit to 5
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, step]);

    const handleSelect = (item) => {
        setSelectedItem(item);
        setStep('confirm');
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/transactions/request', { item_id: selectedItem.id });
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
            setCheckoutResult(null);
        }, 300);
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'search' ? "Find Item" : step === 'confirm' ? "Confirm Checkout" : "Success"}
        >
            {step === 'search' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Search by name, ID, or type..."
                            className="pl-10 py-6 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2 min-h-[200px]">
                        {loading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-600" /></div>}

                        {!loading && searchResults.length === 0 && searchQuery && (
                            <div className="text-center text-gray-500 py-4">No items found.</div>
                        )}

                        {searchResults.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all"
                            >
                                <div className="p-2 bg-white rounded-lg border border-gray-100">
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

            {step === 'confirm' && selectedItem && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Package className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{selectedItem.title}</h3>
                            <p className="text-sm text-gray-500">{selectedItem.type}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedItem.quantity_available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedItem.quantity_available > 0 ? 'Available' : 'Out of Stock'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Due Date</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                                {format(addDays(new Date(), 14), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 py-6" onClick={() => setStep('search')}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 py-6 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            onClick={handleCheckout}
                            isLoading={loading}
                            disabled={selectedItem.quantity_available < 1}
                        >
                            {selectedItem.quantity_available > 0 ? 'Confirm Checkout' : 'Join Waitlist'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'success' && checkoutResult && (
                <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
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

                    <Button className="w-full py-6 text-lg" onClick={reset}>
                        Done
                    </Button>
                </div>
            )}
        </BottomSheet>
    );
};

export default QuickCheckout;
