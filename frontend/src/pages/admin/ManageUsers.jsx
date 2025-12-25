import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, Search, Filter, RefreshCw, Download, Users, GraduationCap, Key, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

import { useAuth } from '../../context/AuthContext';
import BottomSheet from '../../components/ui/BottomSheet';

const ManageUsers = () => {
    const { user: currentUser, refreshProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // pending_approval, approved, rejected, all
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [departments, setDepartments] = useState([]);
    const [stats, setStats] = useState({});

    // Role Management State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [secretKey, setSecretKey] = useState('');
    const [newRole, setNewRole] = useState('');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchDepartments();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [filter, debouncedSearch, roleFilter, deptFilter, batchFilter]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/users/stats');
            setStats(res.data);
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/common/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== 'all') params.status = filter;
            if (debouncedSearch) params.search = debouncedSearch;
            if (roleFilter) params.role = roleFilter;
            if (deptFilter) params.department_id = deptFilter;
            if (batchFilter) params.batch = batchFilter;

            const response = await api.get('/users/', { params });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (e, id, action) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        try {
            await api.post(`/users/${id}/approve`, { action });
            fetchUsers();
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
        }
    };

    const openRoleModal = (e, user) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedUser(user);
        setNewRole(user.role);
        setSecretKey('');
        setShowRoleModal(true);
    };

    const submitRoleChange = async () => {
        if (!selectedUser) return;

        try {
            const payload = { role: newRole };
            if (newRole === 'Admin') {
                if (!secretKey) return alert("Secret Key is required for Admin assignment.");
                payload.secret_key = secretKey;
            }

            await api.post(`/admin/users/${selectedUser.id}/role`, payload);

            // If updating self, refresh profile immediately
            if (currentUser && currentUser.id === selectedUser.id) {
                await refreshProfile();
            }

            fetchUsers();
            setShowRoleModal(false);
            alert("Role updated successfully!");
        } catch (error) {
            console.error("Update role failed", error);
            alert(error.response?.data?.error || "Failed to update role");
        }
    };

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setDeptFilter('');
        setBatchFilter('');
        setFilter('all');
    };

    // Export Modal
    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (type = 'all') => {
        try {
            const params = {};
            if (type === 'current') {
                if (filter !== 'all') params.status = filter;
                if (debouncedSearch) params.search = debouncedSearch;
                if (roleFilter) params.role = roleFilter;
                if (deptFilter) params.department_id = deptFilter;
                if (batchFilter) params.batch = batchFilter;
            }

            const response = await api.get('/export/users', { params, responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const filename = type === 'all'
                ? `All_Users_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
                : `Users_Filtered_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

            saveAs(blob, filename);
            setShowExportModal(false);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed");
        }
    };

    return (
        <div className="p-4 space-y-4 pb-24 max-w-6xl mx-auto">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-indigo-600">
                            Clear Filters
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                {/* Stats Grid - Horizontal Scroll on Mobile */}
                <div className="flex overflow-x-auto pb-2 gap-3 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:pb-0">
                    <div className="min-w-[140px] flex-shrink-0 snap-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                            <p className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{stats.total || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="min-w-[140px] flex-shrink-0 snap-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider">Students</p>
                            <p className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">{stats.students || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="min-w-[140px] flex-shrink-0 snap-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider">Volunteers</p>
                            <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{stats.volunteers || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="min-w-[140px] flex-shrink-0 snap-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider">Incharge</p>
                            <p className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{stats.incharge || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                    <div className="min-w-[140px] flex-shrink-0 snap-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-wider">Admin</p>
                            <p className="text-xl sm:text-2xl font-black text-rose-900 mt-1">{stats.admins || 0}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="Student">Student</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Incharge">Incharge</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <select
                        className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <Input
                        placeholder="Batch (e.g. 2021)"
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'pending_approval', 'approved', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            filter === f
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {f === 'all' ? 'All Users' : f.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                        <RefreshCw className="animate-spin h-8 w-8 mb-2 text-indigo-500" />
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No users found matching your criteria.
                    </div>
                ) : (
                    users.map((user) => (
                        <Link to={`/admin/users/${user.id}`} key={user.id} className="block group">
                            <Card className="hover:shadow-md transition-all duration-200 border-gray-200 group-hover:border-indigo-200">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${user.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            user.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                            <p className="text-xs text-gray-500">{user.roll_number} • {user.email}</p>
                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                {(user.roles && user.roles.length > 0 ? user.roles : [user.role || 'Student']).map(r => (
                                                    <span key={r} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 border border-gray-200 font-medium">
                                                        {r}
                                                    </span>
                                                ))}
                                                {user.department_name && (
                                                    <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded-full text-blue-600 border border-blue-100">
                                                        {user.department_name}
                                                    </span>
                                                )}
                                                {user.batch && (
                                                    <span className="text-[10px] bg-purple-50 px-2 py-0.5 rounded-full text-purple-600 border border-purple-100">
                                                        {user.batch}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {user.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => openRoleModal(e, user)}
                                                className="h-8 text-xs"
                                            >
                                                Change Role
                                            </Button>
                                        )}
                                        {filter === 'pending_approval' && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                                                    onClick={(e) => handleApprove(e, user.id, 'approve')}
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    className="h-9 w-9 bg-rose-500 hover:bg-rose-600 shadow-sm"
                                                    onClick={(e) => handleApprove(e, user.id, 'reject')}
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            <BottomSheet
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                title={`Change Role: ${selectedUser?.name}`}
                footer={
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={submitRoleChange}>
                        Save Role Change
                    </Button>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Select a new role for this user.</p>

                    <div className="space-y-2">
                        {['Student', 'Volunteer', 'Incharge', 'Admin'].map(role => (
                            <label key={role} className={cn(
                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                newRole === role
                                    ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center",
                                        newRole === role ? "border-indigo-600" : "border-gray-400"
                                    )}>
                                        {newRole === role && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                    </div>
                                    <span className={cn("text-sm font-medium", newRole === role ? "text-indigo-900" : "text-gray-700")}>
                                        {role}
                                    </span>
                                </div>
                                {newRole === role && <Check className="w-4 h-4 text-indigo-600" />}
                                <input
                                    type="radio"
                                    name="role"
                                    value={role}
                                    checked={newRole === role}
                                    onChange={() => setNewRole(role)}
                                    className="hidden"
                                />
                            </label>
                        ))}
                    </div>

                    {/* Admin Secret Key Input */}
                    {newRole === 'Admin' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs font-bold text-rose-600 uppercase mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                Admin Access Required
                            </p>
                            <Input
                                type="password"
                                placeholder="Enter Admin Secret Code"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="border-rose-200 focus:ring-rose-500"
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-gray-400 mt-1">This action requires a master secret key.</p>
                        </div>
                    )}
                </div>
            </BottomSheet>

            <BottomSheet
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Users"
            >
                <div className="space-y-4 p-4">
                    <div
                        onClick={() => handleExport('all')}
                        className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                    >
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <Download className="w-6 h-6 text-indigo-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Export All Users</h3>
                            <p className="text-sm text-gray-500">Download complete database of users.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => handleExport('current')}
                        className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    >
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <Filter className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Export Filtered List</h3>
                            <p className="text-sm text-gray-500">Export only the users matching current filters (Batch, Dept, etc).</p>
                        </div>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

export default ManageUsers;
