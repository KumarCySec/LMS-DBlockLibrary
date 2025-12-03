import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Users, Shield, Building, Heart, Package, Calendar,
    BarChart2, Settings, UserPlus, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pending_approvals: 0,
        active_checkouts: 0,
        overdue_items: 0,
        total_users: 0
    });
    const [libraryStatus, setLibraryStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, statusRes, pendingRes] = await Promise.all([
                    api.get('/admin/analytics').catch(() => ({ data: {} })),
                    api.get('/common/status').catch(() => ({ data: {} })),
                    api.get('/users/?status=pending_approval').catch(() => ({ data: [] }))
                ]);

                setStats({
                    ...analyticsRes.data,
                    pending_approvals: pendingRes.data.length || 0
                });
                setLibraryStatus(statusRes.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleLibraryStatus = async () => {
        try {
            const newStatus = !libraryStatus.is_open;
            await api.post('/common/status', {
                is_open: newStatus,
                message: newStatus ? "Library is open." : "Library is closed."
            });
            setLibraryStatus(prev => ({ ...prev, is_open: newStatus }));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const managementModules = [
        { title: 'Users', icon: Users, link: '/admin/users', color: 'bg-blue-100 text-blue-700', desc: 'Manage students & staff' },
        { title: 'Roles & Perms', icon: Shield, link: '/admin/roles', color: 'bg-indigo-100 text-indigo-700', desc: 'Configure access control' },
        { title: 'Departments', icon: Building, link: '/admin/departments', color: 'bg-purple-100 text-purple-700', desc: 'Manage departments' },
        { title: 'Donors', icon: Heart, link: '/admin/donors', color: 'bg-rose-100 text-rose-700', desc: 'Track donors & contributions' },
        { title: 'Inventory', icon: Package, link: '/admin/inventory', color: 'bg-emerald-100 text-emerald-700', desc: 'Books, kits, laptops' },
        { title: 'Roster', icon: Calendar, link: '/admin/roster', color: 'bg-orange-100 text-orange-700', desc: 'Volunteer schedule' },
        { title: 'Analytics', icon: BarChart2, link: '/admin/analytics', color: 'bg-cyan-100 text-cyan-700', desc: 'Usage reports' },
        { title: 'Settings', icon: Settings, link: '/admin/settings', color: 'bg-gray-100 text-gray-700', desc: 'Global configuration' },
    ];

    return (
        <div className="p-4 space-y-6 pb-24 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-sm text-gray-500">Super Admin Control Center</p>
                </div>
                <div className="flex gap-2">
                    {/* Global Search could go here */}
                </div>
            </div>

            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/pending-approvals">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Pending Users</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{stats.pending_approvals}</h3>
                                </div>
                                <UserPlus className="w-6 h-6 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/approvals">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Active Loans</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{stats.active_checkouts}</h3>
                                </div>
                                <CheckCircle className="w-6 h-6 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="border-l-4 border-l-rose-500">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Overdue</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.overdue_items}</h3>
                            </div>
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${libraryStatus?.is_open ? 'border-l-emerald-500' : 'border-l-gray-500'}`}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Library Status</p>
                                <h3 className={`text-xl font-bold ${libraryStatus?.is_open ? 'text-emerald-600' : 'text-gray-600'}`}>
                                    {libraryStatus?.is_open ? 'OPEN' : 'CLOSED'}
                                </h3>
                            </div>
                            <Clock className={`w-6 h-6 ${libraryStatus?.is_open ? 'text-emerald-500' : 'text-gray-500'}`} />
                        </div>
                        {hasPermission(user, 'update_library_status') && (
                            <Button
                                size="xs"
                                variant={libraryStatus?.is_open ? "destructive" : "default"}
                                onClick={toggleLibraryStatus}
                                className="w-full mt-1"
                            >
                                {libraryStatus?.is_open ? 'Close Library' : 'Open Library'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Management Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Management</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {managementModules.map((mod, idx) => (
                        <Link to={mod.link} key={idx}>
                            <Card className="hover:shadow-lg transition-all duration-200 h-full border-transparent hover:border-gray-200">
                                <CardContent className="p-5 flex flex-col items-center text-center h-full justify-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${mod.color}`}>
                                        <mod.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mod.desc}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
