import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const MyBorrowings = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

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
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">My Borrowings</h1>

            {transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">You haven't borrowed any items yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <Card key={tx.id} className={cn("border-l-4",
                            tx.status === 'OVERDUE' ? 'border-l-rose-500' :
                                tx.status === 'ISSUED' ? 'border-l-emerald-500' : 'border-l-gray-300'
                        )}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{tx.item_title}</h3>
                                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", getStatusColor(tx.status))}>
                                        {tx.status}
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
                                    {tx.fine > 0 && (
                                        <div className="mt-2 text-rose-600 font-medium flex items-center bg-rose-50 p-2 rounded">
                                            Fine: ₹{tx.fine}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-400">
                                        ID: {tx.transaction_id}
                                    </div>
                                    {tx.status === 'ISSUED' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8"
                                            onClick={() => handleRenew(tx.id)}
                                        >
                                            Request Renewal
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

export default MyBorrowings;
