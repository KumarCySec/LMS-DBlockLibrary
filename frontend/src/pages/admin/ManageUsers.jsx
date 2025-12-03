import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Check, X, Search, Filter, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // pending_approval, approved, rejected, all
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [departments, setDepartments] = useState([]);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [filter, debouncedSearch, roleFilter, deptFilter, batchFilter]);

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

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setDeptFilter('');
        setBatchFilter('');
        setFilter('all');
    };

    return (
        <div className="p-4 space-y-4 pb-24 max-w-6xl mx-auto">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-indigo-600">
                        Clear Filters
                    </Button>
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
                                                {user.roles.map(r => (
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

                                    {filter === 'pending_approval' && (
                                        <div className="flex gap-2">
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
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
