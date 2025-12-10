import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Loader2, ArrowLeft, User, Book, AlertCircle, CheckCircle, Clock, History,
    RefreshCw, CreditCard, Mail, Phone, Calendar, Edit2, Save, X, Trash2, Shield,
    LayoutDashboard, Activity, FileText
} from 'lucide-react';
import { format } from 'date-fns';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [departments, setDepartments] = useState([]);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Active Tab State
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchUserDetail();
        fetchDepartments();
    }, [userId]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/common/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    };

    const fetchUserDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/users/${userId}`);
            setUser(response.data);
            setEditForm({
                name: response.data.name,
                email: response.data.email,
                phone_number: response.data.phone_number || '',
                batch: response.data.batch || '',
                department_id: response.data.department_id || '',
                roll_number: response.data.roll_number
            });
        } catch (error) {
            console.error("Failed to fetch user details", error);
            setError("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setActionLoading(true);
        try {
            await api.put(`/users/${userId}`, editForm);
            setIsEditing(false);
            fetchUserDetail(); // Refresh to show updates
        } catch (error) {
            alert("Failed to update profile: " + (error.response?.data?.error || error.message));
        } finally {
            setActionLoading(false);
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

    const handleRejectClick = () => setShowRejectModal(true);

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
            if (error.response?.status === 400 && error.response.data.requires_confirmation) {
                const { active_count } = error.response.data;
                const confirmForce = window.confirm(
                    `User has ${active_count} active items. \n\nRETURN these items to inventory and DELETE the user?`
                );

                if (confirmForce) {
                    try {
                        await api.delete(`/users/${userId}?force=true`);
                        alert("Items returned and user deleted successfully");
                        navigate('/admin/users');
                    } catch (forceError) {
                        alert("Failed: " + (forceError.response?.data?.error || forceError.message));
                    }
                }
            } else {
                alert("Failed: " + (error.response?.data?.error || error.message));
            }
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8 min-h-[50vh] items-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="text-red-500 font-medium">{error}</div>
                <Button onClick={fetchUserDetail}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
            </div>
        );
    }

    if (!user) return null;

    const totalFines = user.outstanding_fines_total || 0;
    const paidFines = (user.past_transactions || []).reduce((acc, curr) => acc + (curr.fine || 0), 0);
    const dateFormat = 'dd-MM-yyyy';

    return (
        <div className="p-4 pb-24 max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 -ml-2">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Back
                </Button>

                {user.status === 'pending_approval' ? (
                    <div className="flex gap-2">
                        <Button onClick={handleApprove} isLoading={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 h-9 px-3 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button onClick={handleRejectClick} isLoading={actionLoading} variant="destructive" className="h-9 px-3 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                    </div>
                ) : (
                    !isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="border-indigo-200 text-indigo-700 h-9">
                            <Edit2 className="w-3 h-3 mr-2" /> Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm" disabled={actionLoading} className="h-9">Cancel</Button>
                            <Button onClick={handleSaveProfile} isLoading={actionLoading} size="sm" className="bg-indigo-600 h-9">
                                <Save className="w-3 h-3 mr-2" /> Save
                            </Button>
                        </div>
                    )
                )}
            </div>

            {/* Main Digital ID Card */}
            <div className="relative group perspective mb-6">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-50 blur transition duration-1000"></div>
                <Card className="relative overflow-hidden border-0 rounded-xl bg-white/95 backdrop-blur-sm shadow-xl">
                    <div className="h-24 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
                    </div>

                    <div className="px-5 pb-5 relative -mt-12 flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                        <div className={`relative w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold bg-white overflow-hidden
                            ${user.status === 'approved' ? 'text-indigo-600' : user.status === 'pending_approval' ? 'text-orange-500' : 'text-red-500'}`}>
                            {user.status === 'approved' ? (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                            {isEditing ? (
                                <div className="space-y-2 w-full max-w-sm">
                                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-2 border rounded font-bold" placeholder="Name" />
                                    <input value={editForm.roll_number} onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })} className="w-full p-2 border rounded text-xs" placeholder="Roll No" />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 truncate">{user.name}</h2>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold text-gray-600">{user.roll_number}</span>
                                        {(user.roles || []).map(r => (
                                            <span key={r} className="px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">{r}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-gray-100/80 rounded-xl mb-6 sticky top-2 z-10 backdrop-blur-md shadow-sm border border-gray-200">
                <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Overview</span>
                </button>
                <button onClick={() => setActiveTab('activity')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Book className="w-4 h-4" /> <span className="hidden sm:inline">Activity</span>
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <History className="w-4 h-4" /> <span className="hidden sm:inline">History</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-0 shadow-md ring-1 ring-gray-100">
                            <div className="divide-y divide-gray-100">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Email</p>
                                        {isEditing ? (
                                            <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full text-sm p-1 border rounded" />
                                        ) : (
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone className="w-4 h-4" /></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                                        {isEditing ? (
                                            <input value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} className="w-full text-sm p-1 border rounded" />
                                        ) : (
                                            <p className="text-sm font-bold text-gray-800">{user.phone_number || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-gray-100">
                                    <div className="p-4">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dept</p>
                                        {isEditing ? (
                                            <select value={editForm.department_id} onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })} className="w-full text-sm p-1 border rounded">
                                                <option value="">Select</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        ) : (
                                            <p className="text-sm font-bold text-gray-800">{user.department?.name || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div className="p-4 pl-6">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Batch</p>
                                        {isEditing ? (
                                            <input value={editForm.batch} onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })} className="w-full text-sm p-1 border rounded" />
                                        ) : (
                                            <p className="text-sm font-bold text-gray-800">{user.batch || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                                {user.verified_by && (
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Shield className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Verified By</p>
                                            <p className="text-sm font-bold text-gray-800">
                                                {user.verified_by.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                {user.verified_at ? format(new Date(user.verified_at), "dd-MM-yyyy • HH:mm 'IST'") : ''}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Financials in Overview */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Pending Fees</p>
                                <p className="text-2xl font-black text-red-700">₹{totalFines}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Total Paid</p>
                                <p className="text-2xl font-black text-emerald-700">₹{paidFines}</p>
                            </div>
                        </div>

                        {user.status !== 'blocked' && user.status !== 'rejected' && !isEditing && (
                            <Button onClick={handleDelete} variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold uppercase tracking-wide border border-red-100">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                            </Button>
                        )}
                    </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === 'activity' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        {user.current_checkouts?.length > 0 ? (
                            user.current_checkouts.map((txn) => (
                                <Card key={txn.transaction_id} className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
                                    <div className="p-4 flex gap-4">
                                        <div className="w-12 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400">
                                            <Book className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{txn.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">#{txn.transaction_id}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${txn.status === 'ISSUED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>{txn.status}</span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                                <span className={`flex items-center ${new Date(txn.due_date) < new Date() ? 'text-red-600 font-bold' : ''}`}>
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Due: {txn.due_date ? format(new Date(txn.due_date), dateFormat) : 'N/A'}
                                                </span>
                                                {txn.fine_accrued > 0 && <span className="text-red-600 font-bold">Fine: ₹{txn.fine_accrued}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Book className="w-6 h-6 opacity-30" />
                                </div>
                                <p className="text-sm font-medium">No active loans</p>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                        {user.past_transactions?.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden divide-y divide-gray-100">
                                {user.past_transactions.map((txn) => (
                                    <div key={txn.transaction_id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-sm text-gray-900 line-clamp-1">{txn.title}</p>
                                            {txn.fine > 0 ? (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">₹{txn.fine} Paid</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Returned</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            returned on {txn.return_date ? format(new Date(txn.return_date), dateFormat) : 'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No history available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 ring-1 ring-red-100">
                        <h3 className="text-lg font-bold mb-2 text-red-600">Reject User</h3>
                        <p className="text-sm text-gray-600 mb-4">Provide a reason for rejection.</p>
                        <textarea
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                            rows="3"
                            placeholder="Reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                            <Button onClick={confirmReject} isLoading={actionLoading} variant="destructive">Reject</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetail;
