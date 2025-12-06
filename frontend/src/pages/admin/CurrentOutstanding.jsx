import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Loader2, Calendar, AlertTriangle, ArrowLeft, Search, User, BookOpen, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '../../lib/utils';

const CurrentOutstanding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, overdue, today

    useEffect(() => {
        fetchOutstanding();
    }, []);

    const fetchOutstanding = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/outstanding');
            setTransactions(res.data);
        } catch (error) {
            console.error("Failed to fetch outstanding items", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTxs = transactions.filter(tx => {
        const matchesSearch =
            tx.item_title.toLowerCase().includes(search.toLowerCase()) ||
            tx.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
            tx.borrower_roll.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'overdue') return new Date(tx.due_date) < new Date();
        if (filter === 'today') {
            const due = new Date(tx.due_date);
            const today = new Date();
            return due.toDateString() === today.toDateString();
        }
        return true;
    });

    const isOverdue = (date) => new Date(date) < new Date();

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Current Outstanding</h1>
                        <p className="text-gray-500 text-sm">Monitor active loans and overdue items</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search student, book, or roll number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", filter === 'all' ? "bg-indigo-100 text-indigo-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
                        >
                            All ({transactions.length})
                        </button>
                        <button
                            onClick={() => setFilter('overdue')}
                            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", filter === 'overdue' ? "bg-rose-100 text-rose-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}
                        >
                            Overdue ({transactions.filter(t => isOverdue(t.due_date)).length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : filteredTxs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No outstanding items found.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredTxs.map((tx) => (
                            <Card key={tx.id} className={cn("group hover:shadow-md transition-all border-l-4", isOverdue(tx.due_date) ? "border-l-rose-500" : "border-l-emerald-500")}>
                                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                    <div className="flex gap-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg", isOverdue(tx.due_date) ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600")}>
                                            {tx.item_type === 'Book' ? <BookOpen className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{tx.item_title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">{tx.copy_acc || 'No Acc'}</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {tx.borrower_name} ({tx.borrower_roll})
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto pl-16 md:pl-0">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Due Date</p>
                                            <div className="flex items-center gap-1 justify-end">
                                                <p className={cn("text-sm font-bold", isOverdue(tx.due_date) ? "text-rose-600" : "text-gray-900")}>
                                                    {format(new Date(tx.due_date), 'MMM dd, yyyy')}
                                                </p>
                                                {isOverdue(tx.due_date) && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(tx.due_date), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrentOutstanding;
