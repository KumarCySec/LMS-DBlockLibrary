import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const ManageTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('REQUESTED'); // REQUESTED, ISSUED, OVERDUE

    useEffect(() => {
        // We need an admin endpoint to list all transactions, currently we only have 'my'.
        // Let's assume we create one or reuse list with filters if available.
        // The backend route `list_transactions` wasn't explicitly created in `transactions.py` but mentioned in task.
        // I missed creating a general list endpoint for admin in `transactions.py`.
        // I will use a placeholder or quickly add it if I can, but for now let's mock or try to fetch.
        // Actually, I did NOT implement a general list endpoint in `transactions.py`. I only did `request`, `approve`, `return`, `my`.
        // I need to add `GET /transactions/` for admin.
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/', { params: { status: filter } });
            setTransactions(response.data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/transactions/${id}/approve`, { action: 'approve' });
            fetchTransactions();
        } catch (error) {
            console.error("Failed to approve", error);
        }
    };

    const handleReturn = async (id) => {
        try {
            await api.post(`/transactions/${id}/return`);
            fetchTransactions();
        } catch (error) {
            console.error("Failed to return", error);
        }
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['REQUESTED', 'ISSUED', 'OVERDUE', 'RETURNED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                            filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No transactions found.</div>
                ) : (
                    transactions.map((tx) => (
                        <Card key={tx.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-gray-900">{tx.item_title}</h3>
                                    <p className="text-sm text-gray-500">Borrower: {tx.borrower_name}</p>
                                    <p className="text-xs text-gray-400">Due: {tx.due_date ? format(new Date(tx.due_date), 'MMM d, yyyy') : 'N/A'}</p>
                                </div>
                                <div className="flex gap-2">
                                    {tx.status === 'ISSUED' && (
                                        <Button size="sm" variant="outline" onClick={() => handleReturn(tx.id)}>
                                            <RotateCcw className="w-4 h-4 mr-1" /> Return
                                        </Button>
                                    )}
                                    {/* Add other actions if needed */}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManageTransactions;
