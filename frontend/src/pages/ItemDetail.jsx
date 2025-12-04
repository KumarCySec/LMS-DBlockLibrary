import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck, History, Clock, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDate } from '../utils/dateUtils';

const ActionButtons = ({ item, handleCheckout, handleJoinWaitlist, actionLoading }) => {
    // const { hasPermission } = useAuth(); 
    // Logic is simplified: Everyone sees Checkout if available. Backend handles permissions.

    if (item.quantity_available > 0) {
        return (
            <Button
                className="w-full h-12 text-lg shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleCheckout}
                isLoading={actionLoading}
            >
                Checkout Now
            </Button>
        );
    }

    return (
        <Button
            variant="secondary"
            className="w-full h-12 text-lg shadow-lg shadow-pink-200"
            onClick={handleJoinWaitlist}
            isLoading={actionLoading}
        >
            Join Waitlist
        </Button>
    );
};

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
    const [selectedAccNo, setSelectedAccNo] = useState('');
    const [copyModal, setCopyModal] = useState(null);
    const [checkoutModal, setCheckoutModal] = useState(null);

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            const response = await api.get(`/inventory/${id}`);
            setItem(response.data);
            // Auto-select if only one available copy
            const availableCopies = response.data.copies?.filter(c => c.status === 'AVAILABLE') || [];
            if (availableCopies.length === 1) {
                setSelectedAccNo(availableCopies[0].acc_no);
            }
        } catch (error) {
            console.error("Failed to fetch item", error);
            if (error.response?.status === 404) {
                setError("Item not found");
            } else {
                setError("Couldn't load item details. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (item.copies && item.copies.length > 0 && !selectedAccNo) {
            setMessage({ type: 'error', text: 'Please select a Copy / Accession Number' });
            return;
        }

        setActionLoading(true);
        setMessage(null);
        try {
            const response = await api.post('/transactions/request', {
                item_id: item.id,
                acc_no: selectedAccNo
            });
            const { status, due_date } = response.data;

            if (status === 'ISSUED') {
                setMessage({ type: 'success', text: `Item Issued! Due: ${formatDate(due_date)}` });
            } else {
                setMessage({ type: 'success', text: 'Request sent! Waiting for approval.' });
            }
            // Refresh item data to update availability
            fetchItem();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.response?.data?.error || 'Failed to request checkout' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinWaitlist = async () => {
        setActionLoading(true);
        setMessage(null);
        try {
            await api.post('/common/waitlist', { item_id: item.id });
            setMessage({ type: 'success', text: 'Joined waitlist successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to join waitlist' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (error) return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-gray-500 font-medium">{error}</p>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
                {error !== "Item not found" && (
                    <Button onClick={() => { setError(null); setLoading(true); fetchItem(); }}>
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    );

    if (!item) return null;

    return (
        <div className="p-4 pb-24">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="space-y-6">
                <div>
                    <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">{item.type}</span>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">{item.title}</h1>
                    {item.author && (
                        <Link to={`/catalog?search=${encodeURIComponent(item.author)}`} className="text-indigo-600 hover:underline text-lg block mt-1">
                            {item.author}
                        </Link>
                    )}
                </div>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <span className="text-gray-500">Status</span>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium",
                                item.quantity_available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {item.quantity_available > 0 ? 'Available' : 'Out of Stock'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900">Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {item.language && (
                                    <div>
                                        <span className="block text-gray-500">Language</span>
                                        <span className="text-gray-900">{item.language}</span>
                                    </div>
                                )}
                                {item.model && (
                                    <div>
                                        <span className="block text-gray-500">Model</span>
                                        <span className="text-gray-900">{item.model}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="block text-gray-500">Donor</span>
                                    {item.donor ? (
                                        <Link to={`/admin/donors/${item.donor.id}`} className="text-indigo-600 hover:underline font-medium">
                                            {item.donor.name}
                                            {(item.donor.branch || item.donor.batch) && (
                                                <span className="text-xs text-gray-500 block font-normal">
                                                    {[item.donor.branch, item.donor.batch].filter(Boolean).join(' - ')}
                                                </span>
                                            )}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-900">Anonymous</span>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-gray-500">Date Received</span>
                                    <span className="text-gray-900">
                                        {formatDate(item.date_of_donation)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {item.description && (
                            <div className="pt-2">
                                <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                            </div>
                        )}

                        {/* Copies Selection */}
                        {item.copies && item.copies.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="font-medium text-gray-900 mb-2">Select Copy</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {item.copies.map(copy => (
                                        <button
                                            key={copy.id}
                                            onClick={() => {
                                                if (copy.status === 'AVAILABLE') {
                                                    setSelectedAccNo(copy.acc_no);
                                                    // Open checkout confirmation
                                                    setCheckoutModal(copy);
                                                } else {
                                                    setCopyModal(copy);
                                                }
                                            }}
                                            className={cn(
                                                "p-2 text-xs border rounded-md transition-colors relative",
                                                selectedAccNo === copy.acc_no
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : copy.status === 'AVAILABLE'
                                                        ? "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                            )}
                                        >
                                            {copy.acc_no}
                                            <span className="block text-[10px] opacity-75">{copy.status}</span>
                                            {copy.status !== 'AVAILABLE' && (
                                                <XCircle className="w-3 h-3 absolute top-1 right-1 text-rose-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Checkout Confirmation Modal */}
                {checkoutModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Checkout</h3>
                            <p className="text-gray-600 mb-4">
                                Do you want to checkout copy <strong>{checkoutModal.acc_no}</strong>?
                            </p>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setCheckoutModal(null)} className="flex-1">Cancel</Button>
                                <Button
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    onClick={() => {
                                        handleCheckout();
                                        setCheckoutModal(null);
                                    }}
                                    isLoading={actionLoading}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Copy Info Modal */}
                {copyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Copy Details</h3>
                                <button onClick={() => setCopyModal(null)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <p className="text-xs text-gray-500">Accession Number</p>
                                    <p className="font-medium">{copyModal.acc_no}</p>
                                </div>

                                {copyModal.holder ? (
                                    <>
                                        <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                                            <p className="text-xs text-indigo-600">Currently with</p>
                                            <p className="font-medium text-indigo-900">{copyModal.holder.name}</p>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded border border-orange-100">
                                            <p className="text-xs text-orange-600">Due Date</p>
                                            <p className="font-medium text-orange-900">
                                                {copyModal.holder.due_date ? formatDate(copyModal.holder.due_date) : 'N/A'}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                        <p className="text-sm text-gray-500 italic">Status: {copyModal.status} (No holder info)</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => {
                                    handleJoinWaitlist();
                                    setCopyModal(null);
                                }}
                                isLoading={actionLoading}
                            >
                                Request / Join Waitlist
                            </Button>
                        </div>
                    </div>
                )}

                {/* Current Holders */}
                {item.current_holders && item.current_holders.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Currently Borrowed By
                            </h3>
                            <div className="space-y-3">
                                {item.current_holders.map((holder) => (
                                    <div key={holder.transaction_id} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-indigo-900">{holder.name}</p>
                                                <p className="text-xs text-indigo-700">{holder.department} • {holder.batch}</p>
                                            </div>
                                            <span className="text-xs font-mono bg-white px-2 py-1 rounded text-indigo-600 border border-indigo-200">
                                                {holder.transaction_id}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex gap-4 text-xs text-indigo-800">
                                            <span>Due: {formatDate(holder.due_date)}</span>
                                            {holder.fine_accrued > 0 && <span className="text-red-600 font-bold">Fine: ₹{holder.fine_accrued}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* History */}
                {item.history && item.history.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-600" />
                                History
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {item.history.map((h) => (
                                    <div key={h.transaction_id} className="py-3">
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{h.name}</p>
                                                <p className="text-xs text-gray-500">{h.department} • {h.batch}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">{h.duration_days} days</p>
                                                <p className="text-xs text-gray-400">Returned: {formatDate(h.return_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Waitlist */}
                {item.waitlist && item.waitlist.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                Waitlist ({item.waitlist.length})
                            </h3>
                            <div className="space-y-3">
                                {item.waitlist.map((w, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{w.name}</p>
                                            <p className="text-xs text-gray-500">{w.department} • {w.batch}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {formatDate(w.requested_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 max-w-md mx-auto">
                    {message && (
                        <div className={cn(
                            "mb-4 p-3 rounded-md text-sm flex items-center",
                            message.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                            {message.text}
                        </div>
                    )}

                    <ActionButtons
                        item={item}
                        handleCheckout={handleCheckout}
                        handleJoinWaitlist={handleJoinWaitlist}
                        actionLoading={actionLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
