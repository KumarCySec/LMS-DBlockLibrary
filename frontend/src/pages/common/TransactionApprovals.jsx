import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, RefreshCw, Eye, User, Book, Calendar, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import BottomSheet from '../../components/ui/BottomSheet'; // Assuming we have this or can use a Modal

// Simple Modal Component if BottomSheet isn't suitable for desktop
const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

const TransactionApprovals = () => {
    const { hasPermission } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const filter = searchParams.get('status') || 'REQUESTED';

    // Modal States
    const [selectedTx, setSelectedTx] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // useEffect(() => {
    //     refreshProfile(); // Removed to prevent infinite loop (loading state triggers unmount)
    // }, []);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/transactions/', { params: { status: filter } });
            setRequests(response.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, reason = null) => {
        setActionLoading(true);
        try {
            let endpoint = `/transactions/${id}/approve`;

            if (filter === 'RENEW_REQUESTED') {
                endpoint = `/transactions/${id}/approve_renew`;
            } else if (filter === 'RETURN_REQUESTED') {
                endpoint = `/transactions/${id}/approve-return`;
            }

            const payload = { action };
            if (reason) payload.reason = reason;

            await api.post(endpoint, payload);

            // Close modals and refresh
            setShowDetailModal(false);
            setShowRejectModal(false);
            setRequests(prev => prev.filter(r => r.id !== id));

            // Optional: Show success toast
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
            setRequests(prev => prev.filter(r => r.id !== id));
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
        // Keep detail modal open if it was open? No, maybe close it to focus on rejection.
        // Or stack them. Let's close detail modal for simplicity.
        setShowDetailModal(false);
    };

    const openDetailModal = (tx) => {
        setSelectedTx(tx);
        setShowDetailModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'REQUESTED': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'RENEW_REQUESTED': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'RETURN_REQUESTED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'ISSUED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'OVERDUE': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Check className="w-6 h-6 text-indigo-600" />
                        Approvals & Requests
                    </h1>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'REQUESTED', label: 'Checkouts' },
                            { id: 'RENEW_REQUESTED', label: 'Renewals' },
                            { id: 'RETURN_REQUESTED', label: 'Returns' },
                            { id: 'ISSUED', label: 'Active Loans' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSearchParams({ status: tab.id })}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                    filter === tab.id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                        <p className="text-sm">Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">No pending requests found for this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {requests.map((tx) => (
                            <div
                                key={tx.id}
                                onClick={() => openDetailModal(tx)}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden relative"
                            >
                                {/* Status Stripe */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", getStatusColor(tx.status).split(' ')[0])} />

                                <div className="p-4 pl-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border", getStatusColor(tx.status))}>
                                            {tx.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">{tx.transaction_id}</span>
                                    </div>

                                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors mb-1">
                                        {tx.item_title}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">{tx.borrower_name}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs bg-gray-100 px-1.5 rounded text-gray-600">{tx.borrower_roll}</span>
                                    </div>

                                    {tx.return_feedback && (
                                        <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-100 flex gap-2 items-start">
                                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                            <span className="italic">"{tx.return_feedback}"</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {tx.issue_date ? format(new Date(tx.issue_date), 'MMM d') : 'Requested'}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Quick Actions on Card */}
                                            {(filter === 'REQUESTED' || filter === 'RENEW_REQUESTED') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAction(tx.id, 'approve'); }}
                                                    className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(filter === 'REQUESTED' || filter === 'RENEW_REQUESTED') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openRejectModal(tx); }}
                                                    className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {filter === 'RETURN_REQUESTED' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReturn(tx.id); }}
                                                    className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                    title="Process Return"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                            {(filter === 'REQUESTED' || filter === 'RENEW_REQUESTED') ? (
                                <>
                                    <Button variant="danger" onClick={() => openRejectModal(selectedTx)} isLoading={actionLoading}>
                                        Reject
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(selectedTx.id, 'approve')} isLoading={actionLoading}>
                                        Approve Request
                                    </Button>
                                </>
                            ) : (filter === 'RETURN_REQUESTED' || filter === 'ISSUED') ? (
                                <>
                                    {filter === 'RETURN_REQUESTED' && (
                                        <Button variant="danger" onClick={() => openRejectModal(selectedTx)} isLoading={actionLoading}>
                                            Reject Return
                                        </Button>
                                    )}
                                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleReturn(selectedTx.id)} isLoading={actionLoading}>
                                        Process Return
                                    </Button>
                                </>
                            ) : null}
                        </>
                    )
                }
            >
                {selectedTx && (
                    <div className="space-y-6">
                        {/* Item Info */}
                        <div className="flex gap-4">
                            <div className="w-20 h-28 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                                <Book className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{selectedTx.item_title}</h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{selectedTx.item_type}</span>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">{selectedTx.copy_acc_no}</span>
                                </div>
                                <p className="text-xs text-gray-500">Inventory ID: {selectedTx.inventory_item_id}</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* User Info */}
                        <div>
                            <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Borrower Details</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Name</p>
                                    <p className="font-medium text-gray-900">{selectedTx.borrower_name}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Roll Number</p>
                                    <p className="font-medium text-gray-900">{selectedTx.borrower_roll}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                                    <p className="text-xs text-gray-400 mb-1">Department</p>
                                    <p className="font-medium text-gray-900">{selectedTx.borrower_dept || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Stats */}
                        <div>
                            <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h5>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Requested</span>
                                    <span className="font-medium">{selectedTx.issue_date ? format(new Date(selectedTx.issue_date), 'PPP') : 'Pending'}</span>
                                </div>
                                {selectedTx.due_date && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Due Date</span>
                                        <span className="font-medium">{format(new Date(selectedTx.due_date), 'PPP')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
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
                <div className="space-y-4">
                    <div className="bg-rose-50 p-4 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-rose-900">Action Required</h4>
                            <p className="text-xs text-rose-700 mt-1">Please provide a reason for rejecting this request. This message will be sent to the student.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-shadow"
                            rows="4"
                            placeholder="e.g. Item is damaged, User has overdue books..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            autoFocus
                        ></textarea>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TransactionApprovals;
