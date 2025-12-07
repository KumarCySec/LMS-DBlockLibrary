import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import BottomSheet from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';
import MaxRenewalCard from '../components/MaxRenewalCard';

const MyBorrowings = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Return Modal State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleRenew = async (id) => {
        try {
            await api.post(`/transactions/${id}/renew_request`);
            alert("Renewal requested successfully!");
            fetchTransactions();
        } catch (error) {
            console.error("Failed to request renewal", error);
            alert(error.response?.data?.error || "Failed to request renewal");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            await api.post(`/transactions/${id}/cancel`);
            alert("Request cancelled successfully!");
            fetchTransactions();
        } catch (error) {
            console.error("Failed to cancel request", error);
            alert(error.response?.data?.error || "Failed to cancel request");
        }
    };

    const openReturnModal = (id) => {
        setSelectedTxId(id);
        setFeedback('');
        setShowReturnModal(true);
    };

    const handleReturnRequest = async () => {
        if (!selectedTxId) return;
        setActionLoading(true);
        try {
            await api.post(`/transactions/${selectedTxId}/request-return`, { feedback });
            alert("Return requested successfully!");
            setShowReturnModal(false);
            fetchTransactions();
        } catch (error) {
            console.error("Failed to request return", error);
            alert(error.response?.data?.error || "Failed to request return");
        } finally {
            setActionLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/my');
            setTransactions(response.data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ISSUED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'OVERDUE': return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'RETURNED': return 'text-gray-600 bg-gray-50 border-gray-200';
            case 'REQUESTED': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'RETURN_REQUESTED': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">My Borrowings</h1>
            <MaxRenewalCard transactions={transactions} />

            {transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">You haven't borrowed any items yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <Card key={tx.id} className={cn("border-l-4",
                            tx.status === 'OVERDUE' ? 'border-l-rose-500' :
                                tx.status === 'ISSUED' ? 'border-l-emerald-500' :
                                    tx.status === 'RETURN_REQUESTED' ? 'border-l-purple-500' : 'border-l-gray-300'
                        )}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Link to={`/catalog/${tx.inventory_item_id}`} className="hover:underline">
                                        <h3 className="font-semibold text-gray-900">{tx.item_title}</h3>
                                    </Link>
                                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", getStatusColor(tx.status))}>
                                        {tx.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                    {tx.issue_date && (
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-2" />
                                            Issued: {format(new Date(tx.issue_date), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                    {tx.due_date && tx.status !== 'RETURNED' && (
                                        <div className={cn("flex items-center",
                                            new Date(tx.due_date) < new Date() ? "text-rose-600 font-medium" : ""
                                        )}>
                                            <AlertTriangle className="w-3 h-3 mr-2" />
                                            Due: {format(new Date(tx.due_date), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                    {tx.return_date && (
                                        <div className="flex items-center text-gray-500">
                                            <CheckCircle className="w-3 h-3 mr-2" />
                                            Returned: {format(new Date(tx.return_date), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                    {tx.current_rent > 0 && tx.status === 'ISSUED' && (
                                        <div className="mt-2 text-indigo-600 font-medium flex items-center bg-indigo-50 p-2 rounded border border-indigo-100 animate-pulse">
                                            Current Rent: ₹{tx.current_rent}
                                        </div>
                                    )}
                                    {tx.rent_amount > 0 && (
                                        <div className="mt-2 text-gray-700 font-medium flex items-center bg-gray-100 p-2 rounded border border-gray-200">
                                            Final Rent: ₹{tx.rent_amount}
                                        </div>
                                    )}
                                    {tx.fine > 0 && (
                                        <div className="mt-2 text-rose-600 font-medium flex items-center bg-rose-50 p-2 rounded">
                                            Fine: ₹{tx.fine}
                                        </div>
                                    )}
                                    {tx.rejection_reason && (
                                        <div className="mt-2 text-rose-600 text-sm bg-rose-50 p-2 rounded border border-rose-100">
                                            <strong>Last Rejection:</strong> {tx.rejection_reason}
                                        </div>
                                    )}

                                    {/* Outstanding Dues Alert */}
                                    {((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)) > 0 && (
                                        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                                            <div>
                                                <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Outstanding Dues</p>
                                                <p className="text-lg font-bold text-rose-900">
                                                    ₹{((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)).toFixed(2)}
                                                </p>
                                                {tx.payment_status === 'REQUESTED' && (
                                                    <p className="text-[10px] text-amber-600 font-bold mt-1">Payment Verification Pending</p>
                                                )}
                                            </div>
                                            {tx.payment_status !== 'REQUESTED' && (
                                                <Link to="/payments">
                                                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white h-8 border-0 shadow-sm">
                                                        Pay Now
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-400">
                                        ID: {tx.transaction_id}
                                    </div>
                                    <div className="flex gap-2">
                                        {(tx.status === 'REQUESTED' || tx.status === 'RENEW_REQUESTED' || tx.status === 'RETURN_REQUESTED') && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-8"
                                                onClick={() => handleCancel(tx.id)}
                                            >
                                                Cancel Request
                                            </Button>
                                        )}
                                        {(tx.status === 'ISSUED' || tx.status === 'OVERDUE') && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8"
                                                    onClick={() => handleRenew(tx.id)}
                                                    disabled={((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)) > 0}
                                                    title={((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)) > 0 ? "Please pay outstanding dues first" : "Renew Item"}
                                                >
                                                    Renew
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 disabled:bg-gray-300"
                                                    onClick={() => openReturnModal(tx.id)}
                                                    disabled={((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)) > 0}
                                                    title={((tx.current_fine || 0) + (tx.current_rent || 0) - (tx.fine_paid_amount || 0)) > 0 ? "Please pay outstanding dues first" : "Return Item"}
                                                >
                                                    Return
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }

            <BottomSheet
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="Return Item"
                footer={
                    <Button className="w-full" onClick={handleReturnRequest} isLoading={actionLoading}>
                        Confirm Return Request
                    </Button>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to return this item? You can optionally leave feedback or report any issues below.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Issues (Optional)</label>
                        <Input
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="e.g. Great book! or Mouse not working properly..."
                        />
                    </div>
                </div>
            </BottomSheet>
        </div >
    );
};

export default MyBorrowings;
