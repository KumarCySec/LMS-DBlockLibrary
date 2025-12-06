import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Bell, Send, Users, Layers, GraduationCap, Building2, CheckCircle, AlertCircle, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Data for dropdowns
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target_type: 'all',
        target_value: ''
    });

    useEffect(() => {
        fetchAnnouncements();
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [rolesRes, deptsRes] = await Promise.all([
                api.get('/admin/roles').catch(() => ({ data: [] })),
                api.get('/common/departments').catch(() => ({ data: [] }))
            ]);
            setRoles(rolesRes.data || []);
            setDepartments(deptsRes.data || []);
        } catch (e) { console.error("Failed to fetch metadata", e); }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleUserSearch = async (query) => {
        setUserSearch(query);
        if (query.length < 2) {
            setFoundUsers([]);
            return;
        }
        try {
            const res = await api.get(`/admin/users?search=${query}`);
            setFoundUsers(res.data || []);
        } catch (e) { console.error(e); }
    };

    const selectUser = (u) => {
        setSelectedUser(u);
        setFormData({ ...formData, target_value: u.id });
        setFoundUsers([]);
        setUserSearch('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.target_type === 'specific_user' && !formData.target_value) {
            alert("Please select a user.");
            return;
        }

        setSending(true);
        try {
            await api.post('/announcements', formData);
            setFormData({ title: '', message: '', target_type: 'all', target_value: '' });
            setSelectedUser(null);
            fetchAnnouncements();
            alert("Announcement sent successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to send announcement: " + (e.response?.data?.error || e.message));
        } finally { setSending(false); }
    };

    const targetOptions = [
        { value: 'all', label: 'All Users', icon: Users },
        { value: 'role', label: 'Specific Role', icon: Layers },
        { value: 'department', label: 'Department', icon: Building2 },
        { value: 'batch', label: 'Batch', icon: GraduationCap },
        { value: 'specific_user', label: 'Specific User', icon: User },
        { value: 'overdue_users', label: 'Overdue Users', icon: AlertCircle },
        { value: 'checked_out_users', label: 'Active Borrowers', icon: CheckCircle },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 pb-24">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                    <Bell className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                    <p className="text-gray-500">Broadcast messages to library users</p>
                </div>
            </div>

            {/* Create Announcement */}
            <Card className="border-0 shadow-lg ring-1 ring-gray-100 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                    <CardTitle className="text-indigo-900 flex items-center gap-2">
                        <Send className="w-5 h-5" /> New Announcement
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Target Audience</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {targetOptions.map(opt => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, target_type: opt.value, target_value: '' })}
                                                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${formData.target_type === opt.value
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" /> {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Target Details
                                </label>
                                {formData.target_type === 'role' && (
                                    <select
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        value={formData.target_value}
                                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                )}
                                {formData.target_type === 'department' && (
                                    <select
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        value={formData.target_value}
                                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                )}
                                {formData.target_type === 'batch' && (
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Enter Batch Year (e.g. 2025)"
                                        value={formData.target_value}
                                        onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                                        required
                                    />
                                )}
                                {formData.target_type === 'specific_user' && (
                                    <div className="relative">
                                        {selectedUser ? (
                                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                <span className="font-medium text-indigo-900">{selectedUser.name} ({selectedUser.roll_no})</span>
                                                <button type="button" onClick={() => setSelectedUser(null)} className="text-indigo-500 hover:text-indigo-700">✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        className="w-full pl-10 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="Search user by name or roll no..."
                                                        value={userSearch}
                                                        onChange={e => handleUserSearch(e.target.value)}
                                                    />
                                                </div>
                                                {foundUsers.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {foundUsers.map(u => (
                                                            <div
                                                                key={u.id}
                                                                className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                                                onClick={() => selectUser(u)}
                                                            >
                                                                <p className="font-medium text-sm">{u.name}</p>
                                                                <p className="text-xs text-gray-500">{u.roll_no} • {u.department}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                {['all', 'overdue_users', 'checked_out_users'].includes(formData.target_type) && (
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 italic border border-gray-200">
                                        No additional details required.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                placeholder="e.g. Library Closed for Maintenance"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Message</label>
                            <textarea
                                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                                placeholder="Type your announcement here..."
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                                isLoading={sending}
                            >
                                <Send className="w-4 h-4 mr-2" /> Send Announcement
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* History */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Announcements</h2>
                {announcements.map(ann => (
                    <div key={ann.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900">{ann.title}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {format(new Date(ann.created_at), 'MMM d, h:mm a')}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 whitespace-pre-wrap">{ann.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-3">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> Target: {ann.target_type} {ann.target_value && `(${ann.target_value})`}
                            </span>
                            <span>By: {ann.created_by}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Announcements;
