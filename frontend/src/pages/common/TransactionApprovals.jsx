import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const TransactionApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('REQUESTED'); // REQUESTED, RETURN_REQUESTED

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        // Note: We need a backend endpoint to list ALL transactions with filters.
        // Assuming GET /transactions/all?status=... exists or we add it.
        // For now, I'll assume we need to add this endpoint to `transactions.py` or use a mock.
        // I will add the endpoint in the next step if it doesn't exist.
        // Wait, I didn't add `list_all` in transactions.py yet. I only have `my`.
        // I will add it now in the backend plan or just mock it here for a second.
        // Actually, I should fix the backend first. But let's write the UI code assuming the endpoint.
        try {
            // Temporary: using /transactions/my just to not crash, but this needs a real endpoint
            // I will add `GET /transactions/` (list all) in the next backend step.
            const response = await api.get('/transactions/', { params: { status: filter } });
            setRequests(response.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const endpoint = filter === 'RENEW_REQUESTED'
                ? `/transactions/${id}/approve_renew`
                : `/transactions/${id}/approve`;

            await api.post(endpoint, { action });
            setRequests(requests.filter(r => r.id !== id));
        } catch (error) {
            console.error(`Failed to ${action}`, error);
        }
    };

    const handleReturn = async (id) => {
        try {
            await api.post(`/transactions/${id}/return`);
            setRequests(requests.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to return", error);
        }
    }

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Transaction Approvals</h1>

            <div className="flex gap-2 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setFilter('REQUESTED')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'REQUESTED' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
                    )}
                >
                    Checkouts
                </button>
                <button
                    onClick={() => setFilter('RENEW_REQUESTED')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'RENEW_REQUESTED' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
                    )}
                >
                    Renewals
                </button>
                <button
                    onClick={() => setFilter('ISSUED')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'ISSUED' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
                    )}
                >
                    Returns
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No pending requests.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((tx) => (
                        <Card key={tx.id}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{tx.item_title}</h3>
                                        <p className="text-sm text-gray-600">User: {tx.borrower_name}</p>
                                        <p className="text-xs text-gray-400">ID: {tx.transaction_id}</p>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        {tx.status}
                                    </span>
                                </div>

                                <div className="flex justify-end gap-2 mt-3">
                                    {filter === 'REQUESTED' || filter === 'RENEW_REQUESTED' ? (
                                        <>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleAction(tx.id, 'approve')}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                onClick={() => handleAction(tx.id, 'reject')}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => handleReturn(tx.id)}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-1" /> Mark Returned
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionApprovals;
