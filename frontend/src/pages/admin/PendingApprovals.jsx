import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, User } from 'lucide-react';

const PendingApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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
        try {
            await api.post(`/users/${id}/approve`, { action });
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
        }
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No pending approvals.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.roll_number} • {user.email}</p>
                                        <p className="text-xs text-gray-400">{user.branch} • {user.batch}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleAction(user.id, 'approve')}
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                        onClick={() => handleAction(user.id, 'reject')}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
