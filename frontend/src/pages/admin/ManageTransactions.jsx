import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, RotateCcw, Download, Filter, Search, Eye, MoreHorizontal, Calendar, User, Book, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filter, setFilter] = useState(searchParams.get('status') || 'ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedTx, setSelectedTx] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam) {
            setFilter(statusParam);
        }
    }, [searchParams]);

    useEffect(() => {
        setSearchParams({ status: filter });
        fetchTransactions();
    }, [filter]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTransactions(transactions);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = transactions.filter(tx =>
                tx.item_title.toLowerCase().includes(query) ||
                tx.borrower_name.toLowerCase().includes(query) ||
                tx.transaction_id.toLowerCase().includes(query) ||
                tx.borrower_roll.toLowerCase().includes(query)
            );
            setFilteredTransactions(filtered);
        }
    }, [searchQuery, transactions]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== 'ALL') params.status = filter;
            const response = await api.get('/transactions/', { params });
            setTransactions(response.data);
            setFilteredTransactions(response.data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, reason = null) => {
        setActionLoading(true);
        try {
            // Determine endpoint based on transaction status or context
            // If we are rejecting a return, we need to use approve-return endpoint
            let endpoint = `/transactions/${id}/approve`;

            // Check if it's a return rejection
            // We can check selectedTx status if available, or infer from context
            if (selectedTx && selectedTx.status === 'RETURN_REQUESTED') {
                endpoint = `/transactions/${id}/approve-return`;
            }

            const payload = { action };
            if (reason) payload.reason = reason;

            await api.post(endpoint, payload);

            setShowDetailModal(false);
            setShowRejectModal(false);
            fetchTransactions();
        } catch (error) {
            console.error(`Failed to ${action}`, error);
            alert(`Failed to ${action}: ` + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturn = async (id) => {
        setActionLoading(true);
        try {
            await api.post(`/transactions/${id}/approve-return`, {});
            setShowDetailModal(false);
            fetchTransactions();
        } catch (error) {
            console.error("Failed to return", error);
            alert("Failed to return: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (tx) => {
        setSelectedTx(tx);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const openDetailModal = (tx) => {
        setSelectedTx(tx);
        setShowDetailModal(true);
    };

    const exportToExcel = () => {
        const dataToExport = filteredTransactions.map(tx => ({
            "Transaction ID": tx.transaction_id,
            "Item Title": tx.item_title,
            "Item Type": tx.item_type,
            "Accession No": tx.copy_acc_no,
            "Borrower Name": tx.borrower_name,
            "Borrower Roll No": tx.borrower_roll,
            "Department": tx.borrower_dept,
            "Status": tx.status,
            "Issue Date": tx.issue_date ? format(new Date(tx.issue_date), 'dd/MM/yyyy') : '',
            "Due Date": tx.due_date ? format(new Date(tx.due_date), 'dd/MM/yyyy') : '',
            "Return Date": tx.return_date ? format(new Date(tx.return_date), 'dd/MM/yyyy') : '',
            "Fine Amount": tx.fine,
            "Approved By": tx.approved_by || '',
            "Rejected By": tx.rejected_by || '',
            "Rejection Reason": tx.rejection_reason || '',
            "Return Processed By": tx.return_approved_by || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Transactions_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'REQUESTED': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'RENEW_REQUESTED': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'RETURN_REQUESTED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'ISSUED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'RETURNED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'OVERDUE': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaction History</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor and manage all library borrowing activities</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['ALL', 'REQUESTED', 'ISSUED', 'OVERDUE', 'RETURN_REQUESTED', 'RETURNED', 'REJECTED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                            filter === f
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading records...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Item Details</th>
                                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Borrower</th>
                                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Dates</th>
                                        <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTransactions.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            onClick={() => openDetailModal(tx)}
                                            className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                        <Book className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{tx.item_title}</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{tx.transaction_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{tx.borrower_name}</p>
                                                    <p className="text-xs text-gray-500">{tx.borrower_roll}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", getStatusColor(tx.status))}>
                                                    {tx.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {tx.issue_date && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3 text-gray-400" />
                                                            {format(new Date(tx.issue_date), 'MMM d, yyyy')}
                                                        </span>
                                                    )}
                                                    {!tx.issue_date && <span className="text-gray-400 italic">Pending</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-indigo-600">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    onClick={() => openDetailModal(tx)}
                                    className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                <Book className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 line-clamp-1">{tx.item_title}</h4>
                                                <p className="text-xs text-gray-500 font-mono">{tx.transaction_id}</p>
                                            </div>
                                        </div>
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide", getStatusColor(tx.status))}>
                                            {tx.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="pl-[52px] space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{tx.borrower_name}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {tx.issue_date ? format(new Date(tx.issue_date), 'MMM d') : 'Pending'}
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Transaction Details"
                footer={
                    selectedTx && (
                        <>
                            {selectedTx.status === 'REQUESTED' && (
                                <>
                                    <Button variant="danger" onClick={() => openRejectModal(selectedTx)} isLoading={actionLoading}>
                                        Reject
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(selectedTx.id, 'approve')} isLoading={actionLoading}>
                                        Approve
                                    </Button>
                                </>
                            )}
                            {(selectedTx.status === 'ISSUED' || selectedTx.status === 'OVERDUE' || selectedTx.status === 'RETURN_REQUESTED') && (
                                <>
                                    {selectedTx.status === 'RETURN_REQUESTED' && (
                                        <Button variant="danger" onClick={() => openRejectModal(selectedTx)} isLoading={actionLoading}>
                                            Reject Return
                                        </Button>
                                    )}
                                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleReturn(selectedTx.id)} isLoading={actionLoading}>
                                        Process Return
                                    </Button>
                                </>
                            )}
                        </>
                    )
                }
            >
                {selectedTx && (
                    <div className="space-y-8">
                        {/* Status Banner */}
                        <div className={cn("p-4 rounded-xl border flex items-center justify-between", getStatusColor(selectedTx.status))}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Current Status</p>
                                    <p className="font-bold text-lg">{selectedTx.status.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-80 font-mono">ID: {selectedTx.transaction_id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Item Info */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Book className="w-4 h-4 text-indigo-600" /> Item Details
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Title</p>
                                        <p className="font-medium text-gray-900">{selectedTx.item_title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Type</p>
                                            <p className="font-medium text-gray-900">{selectedTx.item_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Accession No</p>
                                            <p className="font-medium text-indigo-600 font-mono">{selectedTx.copy_acc_no}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Borrower Info */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-600" /> Borrower Details
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Name</p>
                                        <p className="font-medium text-gray-900">{selectedTx.borrower_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                                            <p className="font-medium text-gray-900">{selectedTx.borrower_roll}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Department</p>
                                            <p className="font-medium text-gray-900">{selectedTx.borrower_dept || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Timeline
                            </h4>
                            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Issued Date</p>
                                    <p className="font-medium text-gray-900">
                                        {selectedTx.issue_date ? format(new Date(selectedTx.issue_date), 'MMM d, yyyy') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                                    <p className={cn("font-medium", selectedTx.status === 'OVERDUE' ? "text-rose-600" : "text-gray-900")}>
                                        {selectedTx.due_date ? format(new Date(selectedTx.due_date), 'MMM d, yyyy') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Returned Date</p>
                                    <p className="font-medium text-gray-900">
                                        {selectedTx.return_date ? format(new Date(selectedTx.return_date), 'MMM d, yyyy') : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Fine Amount</p>
                                    <p className="font-medium text-gray-900">
                                        {selectedTx.fine ? `₹${selectedTx.fine}` : '₹0'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(selectedTx.approved_by || selectedTx.rejected_by || selectedTx.rejection_reason) && (
                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                                {selectedTx.approved_by && <p>Approved by: <span className="font-medium text-gray-900">{selectedTx.approved_by}</span></p>}
                                {selectedTx.rejected_by && <p>Rejected by: <span className="font-medium text-gray-900">{selectedTx.rejected_by}</span></p>}
                                {selectedTx.rejection_reason && (
                                    <div className="bg-rose-50 p-3 rounded border border-rose-100 text-rose-800">
                                        <span className="font-bold">Rejection Reason:</span> {selectedTx.rejection_reason}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Request"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={() => handleAction(selectedTx.id, 'reject', rejectionReason)} isLoading={actionLoading}>
                            Confirm Rejection
                        </Button>
                    </>
                }
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                        rows="4"
                        placeholder="Reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                </div>
            </Modal>
        </div>
    );
};

export default ManageTransactions;
