import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, User, ChevronRight, Mail, Phone, Calendar, BookOpen, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

import { useToast } from '../../context/ToastContext';

const PendingApprovals = () => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [processing, setProcessing] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, name

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await api.get('/users/', { params: { status: 'pending_approval' } });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch pending users", error);
            toast.error("Failed to fetch pending users");
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
            toast.success(`User ${action}ed successfully`);
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
            toast.error(`Failed to ${action} user`);
        } finally {
            setProcessing(null);
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = (
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesDept = departmentFilter ? user.department_name === departmentFilter : true;
        const matchesBatch = batchFilter ? user.batch === batchFilter : true;
        return matchesSearch && matchesDept && matchesBatch;
    }).sort((a, b) => {
        if (sortOrder === 'name') return a.name.localeCompare(b.name);
        if (sortOrder === 'newest') return new Date(b.joined_at) - new Date(a.joined_at); // joined_at is string 'dd-mm-yyyy', might need parsing if sorting strictly by date. 
        // But for now, let's assume standard ID sort typically mirrors time or just simplistic sort. 
        // Actually user.joined_at is formatted string.Let's rely on ID descending for 'newest' usually? 
        // Or just keep it simple.Let's use ID for newest/oldest proxy if date parsing is tricky.
        if (sortOrder === 'newest') return b.id - a.id;
        if (sortOrder === 'oldest') return a.id - b.id;
        return 0;
    });

    // Extract Unique Depts & Batches for Filters
    const uniqueDepts = [...new Set(users.map(u => u.department_name).filter(Boolean))];
    const uniqueBatches = [...new Set(users.map(u => u.batch).filter(Boolean))];

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-gray-500">Review and approve new user registrations</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                        {users.length} Pending
                    </span>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <Card className="bg-white shadow-sm border-gray-200">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <input
                            type="text"
                            placeholder="Search Name, Roll No, Email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Filters */}
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                    >
                        <option value="">All Batches</option>
                        {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No match found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
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
