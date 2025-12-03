import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, BookOpen, Clock, AlertCircle, CheckCircle, Calendar, Package, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const InchargeDashboard = () => {
    const { user, hasPermission } = useAuth();
    const [stats, setStats] = useState({
        total_inventory: 0,
        active_loans: 0,
        pending_approvals: 0,
        today_volunteers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [inventoryRes, pendingRes] = await Promise.all([
                    api.get('/inventory/stats').catch(() => ({ data: { total_items: 0 } })),
                    api.get('/users/?status=pending_approval').catch(() => ({ data: [] }))
                ]);

                setStats({
                    total_inventory: inventoryRes.data.total_items || 0,
                    active_loans: 0,
                    pending_approvals: pendingRes.data.length || 0,
                    today_volunteers: 0
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const allMenuItems = [
        { title: 'Manage Inventory', icon: Package, link: '/admin/inventory', color: 'bg-blue-50 text-blue-700', perm: 'manage_inventory' },
        { title: 'Pending Approvals', icon: UserPlus, link: '/admin/pending-approvals', color: 'bg-amber-50 text-amber-700', perm: 'manage_users' },
        { title: 'Manage Roster', icon: Calendar, link: '/admin/roster', color: 'bg-purple-50 text-purple-700', perm: 'manage_roster' },
        { title: 'Manage Donors', icon: Users, link: '/admin/donors', color: 'bg-emerald-50 text-emerald-700', perm: 'manage_inventory' },
    ];

    const menuItems = allMenuItems.filter(item => !item.perm || hasPermission(item.perm));

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Incharge Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Package className="w-8 h-8 text-blue-600 mb-2" />
                        <span className="text-2xl font-bold">{stats.total_inventory}</span>
                        <span className="text-xs text-gray-500">Total Items</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <UserPlus className="w-8 h-8 text-amber-600 mb-2" />
                        <span className="text-2xl font-bold">{stats.pending_approvals}</span>
                        <span className="text-xs text-gray-500">Pending Users</span>
                    </CardContent>
                </Card>
                {/* Add more stats as needed */}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {menuItems.map((item) => (
                        <Link to={item.link} key={item.title}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-transparent hover:border-gray-200">
                                <CardContent className={`p-4 flex flex-col items-center justify-center h-32 ${item.color} rounded-lg`}>
                                    <item.icon className="w-8 h-8 mb-2" />
                                    <span className="font-medium text-center">{item.title}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InchargeDashboard;
