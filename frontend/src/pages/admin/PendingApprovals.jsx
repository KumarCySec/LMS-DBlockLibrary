import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, User, ChevronRight, Mail, Phone, Calendar, BookOpen, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

const PendingApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await api.get('/users/', { params: { status: 'pending_approval' } });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch pending users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        setProcessing(id);
        try {
            await api.post(`/users/${id}/approve`, { action });
            setUsers(users.filter(u => u.id !== id));
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
            alert(`Failed to ${action} user`);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-gray-500">Review and approve new user registrations</p>
                </div>
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    {users.length} Pending
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500">No pending approvals at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <Card
                            key={user.id}
                            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-indigo-500"
                            onClick={() => setSelectedUser(user)}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                            <p className="text-xs text-gray-500 font-medium">{user.roll_number}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <BookOpen className="w-3 h-3 mr-2 text-indigo-500" />
                                        {user.department_name || 'No Dept'} • {user.batch || 'No Batch'}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <Mail className="w-3 h-3 mr-2 text-indigo-500" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAction(user.id, 'approve');
                                        }}
                                        isLoading={processing === user.id}
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAction(user.id, 'reject');
                                        }}
                                        disabled={processing === user.id}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold shadow-lg">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                            <p className="text-indigo-100 text-sm">{selectedUser.role || 'Student'}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Roll Number</p>
                                    <p className="font-medium text-gray-900">{selectedUser.roll_number}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Batch</p>
                                    <p className="font-medium text-gray-900">{selectedUser.batch}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Department</p>
                                        <p className="font-medium text-gray-900">{selectedUser.department_name || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                        <p className="font-medium text-gray-900 break-all">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                        <p className="font-medium text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                                    onClick={() => handleAction(selectedUser.id, 'approve')}
                                    isLoading={processing === selectedUser.id}
                                >
                                    <Check className="w-5 h-5 mr-2" /> Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 py-6 text-lg"
                                    onClick={() => handleAction(selectedUser.id, 'reject')}
                                    disabled={processing === selectedUser.id}
                                >
                                    <X className="w-5 h-5 mr-2" /> Reject
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
