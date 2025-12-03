import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, ArrowLeft, User, Book, AlertCircle, CheckCircle, Clock, History, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [roles, setRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        if (showRoleModal && roles.length === 0) {
            fetchRoles();
        }
    }, [showRoleModal]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/admin/roles');
            setRoles(res.data);
            setSelectedRoles(user.roles);
        } catch (error) {
            console.error("Failed to fetch roles", error);
        }
    };

    const handleRoleSave = async () => {
        setActionLoading(true);
        try {
            await api.put(`/users/${userId}/roles`, { roles: selectedRoles });
            setShowRoleModal(false);
            fetchUserDetail();
        } catch (error) {
            alert("Failed to update roles");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!window.confirm("Are you sure you want to BLOCK this user?")) return;
        setActionLoading(true);
        try {
            await api.put(`/users/${userId}/status`, { status: 'blocked' });
            fetchUserDetail();
        } catch (error) {
            alert("Failed to block user");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleRole = (roleName) => {
        if (selectedRoles.includes(roleName)) {
            setSelectedRoles(selectedRoles.filter(r => r !== roleName));
        } else {
            setSelectedRoles([...selectedRoles, roleName]);
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

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto relative">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" /> User Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'approved' ? 'bg-green-100 text-green-700' :
                                user.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {user.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="font-medium text-lg">{user.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Roll Number</p>
                                <p className="font-medium">{user.roll_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium break-all">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-medium">{user.phone || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs text-gray-500">Batch</p>
                                    <p className="font-medium">{user.batch || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Department</p>
                                    <p className="font-medium">{user.department?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">Roles</p>
                                    <button onClick={() => setShowRoleModal(true)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {user.roles.map(r => (
                                        <span key={r} className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {user.verified_by && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Verified By</p>
                                <p className="text-sm font-medium">{user.verified_by.name}</p>
                                <p className="text-xs text-gray-400">
                                    {user.verified_at ? format(new Date(user.verified_at), 'PPP p') : ''}
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                            {user.status === 'pending_approval' && (
                                <div className="flex gap-2">
                                    <Button onClick={handleApprove} isLoading={actionLoading} className="bg-green-600 hover:bg-green-700 flex-1">
                                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                    </Button>
                                    <Button onClick={handleReject} isLoading={actionLoading} variant="destructive" className="flex-1">
                                        <AlertCircle className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            )}
                            {user.status !== 'blocked' && user.status !== 'rejected' && (
                                <Button onClick={handleBlock} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 w-full">
                                    Block User
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Active Checkouts & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Checkouts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Book className="w-5 h-5" /> Active Checkouts
                                </div>
                                {user.outstanding_fines_total > 0 && (
                                    <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                                        Fines: ₹{user.outstanding_fines_total}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.current_checkouts && user.current_checkouts.length > 0 ? (
                                <div className="space-y-4">
                                    {user.current_checkouts.map((txn) => (
                                        <div key={txn.transaction_id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                                            <div>
                                                <h4 className="font-medium text-indigo-600">{txn.title}</h4>
                                                <p className="text-sm text-gray-500">{txn.type} • {txn.transaction_id}</p>
                                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" /> Due: {txn.due_date ? format(new Date(txn.due_date), 'PP') : 'N/A'}
                                                    </span>
                                                    {txn.fine_accrued > 0 && (
                                                        <span className="text-red-600 font-medium">Fine: ₹{txn.fine_accrued}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                                                    {txn.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic">No active checkouts</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Past Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5" /> Recent History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.past_transactions && user.past_transactions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {user.past_transactions.map((txn) => (
                                        <div key={txn.transaction_id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{txn.title}</p>
                                                <p className="text-xs text-gray-500">Returned: {txn.return_date ? format(new Date(txn.return_date), 'PP') : 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                {txn.fine > 0 ? (
                                                    <span className="text-xs text-red-600 font-medium">Paid Fine: ₹{txn.fine}</span>
                                                ) : (
                                                    <span className="text-xs text-green-600">No Fine</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic">No past transactions</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Manage Roles</h3>
                        <div className="space-y-2 mb-6">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role.name)}
                                        onChange={() => toggleRole(role.name)}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span className="font-medium">{role.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowRoleModal(false)}>Cancel</Button>
                            <Button onClick={handleRoleSave} isLoading={actionLoading}>Save Roles</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetail;
