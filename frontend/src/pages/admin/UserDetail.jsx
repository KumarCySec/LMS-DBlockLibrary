import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, ArrowLeft, User, Book, AlertCircle, CheckCircle, Clock, History, RefreshCw, CreditCard, Shield, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchUserDetail();
    }, [userId]);

    const fetchUserDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/users/${userId}`);
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
            setError("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.post(`/users/${userId}/approve`, { action: 'approve' });
            fetchUserDetail();
        } catch (error) {
            alert("Failed to approve user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectClick = () => {
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        setActionLoading(true);
        try {
            await api.post(`/users/${userId}/approve`, { action: 'reject', reason: rejectionReason });
            setShowRejectModal(false);
            fetchUserDetail();
        } catch (error) {
            alert("Failed to reject user");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to DELETE this user? This action cannot be undone.")) return;

        setActionLoading(true);
        try {
            await api.delete(`/users/${userId}`);
            alert("User deleted successfully");
            navigate('/admin/users');
        } catch (error) {
            if (error.response && error.response.status === 400 && error.response.data.requires_confirmation) {
                const { active_count } = error.response.data;
                const confirmForce = window.confirm(
                    `User has ${active_count} active items. \n\nDo you want to RETURN these items to inventory and DELETE the user?`
                );

                if (confirmForce) {
                    try {
                        await api.delete(`/users/${userId}?force=true`);
                        alert("Items returned and user deleted successfully");
                        navigate('/admin/users');
                    } catch (forceError) {
                        alert("Failed to delete user: " + (forceError.response?.data?.error || forceError.message));
                    }
                }
            } else {
                alert("Failed to delete user: " + (error.response?.data?.error || error.message));
            }
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="text-red-500 font-medium">{error}</div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={fetchUserDetail}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Calculate Financials
    const totalFines = user.outstanding_fines_total || 0;
    const paidFines = (user.past_transactions || []).reduce((acc, curr) => acc + (curr.fine || 0), 0);

    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto relative animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
                </Button>
                {user.status === 'pending_approval' && (
                    <div className="flex gap-2">
                        <Button onClick={handleApprove} isLoading={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve User
                        </Button>
                        <Button onClick={handleRejectClick} isLoading={actionLoading} variant="destructive">
                            <AlertCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Area: Profile Card (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-t-4 border-t-indigo-600 shadow-lg">
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 border-b border-gray-100 flex flex-col items-center text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-md mb-4 ${user.status === 'approved' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' :
                                    user.status === 'pending_approval' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-500 font-medium">{user.roll_number}</p>

                            <div className="flex gap-2 mt-4 flex-wrap justify-center">
                                {(user.roles || []).map(r => (
                                    <span key={r} className="px-2 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                <div className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                        <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{user.phone_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <Book className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Dept</p>
                                            <p className="text-sm font-medium text-gray-900">{user.department?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Batch</p>
                                            <p className="text-sm font-medium text-gray-900">{user.batch || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Joined</p>
                                        <p className="text-sm font-medium text-gray-900">{user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            {user.status !== 'blocked' && user.status !== 'rejected' && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <Button onClick={handleDelete} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                        Delete User Account
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Summary Card */}
                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Financials
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Due</p>
                                    <p className="text-2xl font-bold text-red-700">₹{totalFines}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Paid</p>
                                    <p className="text-2xl font-bold text-emerald-700">₹{paidFines}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Area: Activity (8 cols) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Active Checkouts */}
                    <Card className="shadow-md border-0 ring-1 ring-gray-200">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                                    <Book className="w-5 h-5 text-indigo-600" /> Active Checkouts
                                </CardTitle>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
                                    {user.current_checkouts?.length || 0} items
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {user.current_checkouts && user.current_checkouts.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {user.current_checkouts.map((txn) => (
                                        <div key={txn.transaction_id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                                            <div className="flex gap-4">
                                                <div className="p-3 bg-indigo-50 rounded-lg h-fit">
                                                    <Book className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{txn.title}</h4>
                                                    <p className="text-sm text-gray-500 mb-2">{txn.type} • {txn.transaction_id}</p>

                                                    <div className="flex items-center gap-4 text-xs">
                                                        <span className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            <Clock className="w-3 h-3 mr-1" /> Due: {txn.due_date ? format(new Date(txn.due_date), 'PP') : 'N/A'}
                                                        </span>
                                                        {txn.fine_accrued > 0 && (
                                                            <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded font-bold">
                                                                Fine: ₹{txn.fine_accrued}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-center">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-bold border border-emerald-100">
                                                    {txn.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 bg-white">
                                    <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No active checkouts</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card className="shadow-md border-0 ring-1 ring-gray-200">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                                <History className="w-5 h-5 text-gray-600" /> Transaction History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {user.past_transactions && user.past_transactions.length > 0 ? (
                                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {user.past_transactions.map((txn) => (
                                        <div key={txn.transaction_id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{txn.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    Returned: {txn.return_date ? format(new Date(txn.return_date), 'PP p') : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {txn.fine > 0 ? (
                                                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                        Paid ₹{txn.fine}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Regular Return</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 bg-white">
                                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No past transactions</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold mb-2 text-red-600">Reject User</h3>
                        <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection. This will be visible to the user.</p>

                        <textarea
                            className="w-full border border-gray-300 rounded-md p-3 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            rows="4"
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                            <Button onClick={confirmReject} isLoading={actionLoading} variant="destructive">Reject User</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetail;
