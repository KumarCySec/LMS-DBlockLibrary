import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    Loader2, Clock, Calendar, Package, UserPlus, CheckCircle,
    AlertCircle, Search, ShoppingBag, History, Zap, BookOpen, Download, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { hasPermission, hasAnyPermission, getPrimaryRole } from '../utils/permissions';
import AdminDashboard from './admin/AdminDashboard';
import QuickCheckout from '../components/QuickCheckout';
import BottomSheet from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';

const Home = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState(null);
    const [roster, setRoster] = useState([]);
    const [stats, setStats] = useState({
        active_loans: 0,
        overdue: 0,
        pending_approvals: 0
    });
    const [loading, setLoading] = useState(true);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState({ is_open: false, message: '' });
    const [refreshing, setRefreshing] = useState(false);

    const handleUpdateStatus = async () => {
        try {
            await api.post('/common/status', newStatus);
            setShowStatusModal(false);
            // Refresh status
            const res = await api.get('/common/status');
            setStatus(res.data);
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        await fetchData(); // Re-fetch dashboard data
        setRefreshing(false);
    };

    const fetchData = async () => {
        try {
            const promises = [
                api.get('/common/status'),
                api.get('/admin/roster')
            ];

            // Fetch stats if allowed
            if (hasAnyPermission(user, ['view_inventory', 'approve_checkout'])) {
                promises.push(api.get('/inventory/stats').catch(() => ({ data: {} })));
                promises.push(api.get('/users/?status=pending_approval').catch(() => ({ data: [] })));
            } else {
                promises.push(Promise.resolve({ data: {} })); // Placeholder
                promises.push(Promise.resolve({ data: [] })); // Placeholder
            }

            // Fetch my borrowings for everyone
            promises.push(api.get('/transactions/my').catch(() => ({ data: [] })));

            const results = await Promise.all(promises);

            setStatus(results[0].data);
            setRoster(results[1].data);

            const myTxs = results[4].data || [];
            const activeLoans = myTxs.filter(t => t.status === 'ISSUED').length;
            const overdue = myTxs.filter(t => t.status === 'OVERDUE' || (t.status === 'ISSUED' && new Date(t.due_date) < new Date())).length;

            let pendingCount = 0;
            if (results[3] && Array.isArray(results[3].data)) {
                pendingCount = results[3].data.length;
            }

            setStats({
                active_loans: activeLoans,
                overdue: overdue,
                pending_approvals: pendingCount
            });

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    const primaryRole = getPrimaryRole(user);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRoster = roster.find(r => r.date === todayStr);

    // Define all possible cards
    const allCards = [
        {
            id: 'approvals',
            label: 'Approvals',
            icon: CheckCircle,
            link: '/approvals',
            color: 'bg-emerald-100 text-emerald-700',
            badge: stats.pending_approvals,
            perm: ['approve_checkout', 'approve_return', 'approve_renew']
        },
        {
            id: 'pending_users',
            label: 'Pending Users',
            icon: UserPlus,
            link: '/admin/pending-approvals',
            color: 'bg-amber-100 text-amber-700',
            badge: stats.pending_approvals,
            perm: 'approve_users'
        },
        {
            id: 'users',
            label: 'Users',
            icon: UserPlus, // Or Users icon
            link: '/admin/users',
            color: 'bg-blue-100 text-blue-700',
            perm: 'manage_users'
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: Package,
            link: '/admin/inventory',
            color: 'bg-purple-100 text-purple-700',
            perm: 'manage_inventory'
        },
        {
            id: 'donors',
            label: 'Donors',
            icon: UserPlus, // Need Heart icon?
            link: '/admin/donors',
            color: 'bg-rose-100 text-rose-700',
            perm: 'manage_donors'
        },
        {
            id: 'departments',
            label: 'Depts',
            icon: Package, // Need Building icon?
            link: '/admin/departments',
            color: 'bg-indigo-100 text-indigo-700',
            perm: 'manage_departments'
        },
        {
            id: 'roles',
            label: 'Roles',
            icon: CheckCircle, // Need Shield icon?
            link: '/admin/roles',
            color: 'bg-gray-100 text-gray-700',
            perm: 'manage_roles_permissions'
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: History,
            link: '/admin/analytics',
            color: 'bg-pink-100 text-pink-700',
            perm: 'view_analytics'
        },
        {
            id: 'roster',
            label: 'Roster',
            icon: Calendar,
            link: '/admin/roster',
            color: 'bg-orange-100 text-orange-700',
            perm: 'manage_roster'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Zap, // Need Settings icon?
            link: '/admin/settings',
            color: 'bg-gray-200 text-gray-800',
            perm: 'manage_settings'
        },
        {
            id: 'my_borrowings',
            label: 'My Items',
            icon: ShoppingBag,
            link: '/my-borrowings',
            color: 'bg-blue-100 text-blue-700',
            perm: null // Public
        },

        {
            id: 'transactions',
            label: 'Transactions',
            icon: History,
            link: '/admin/transactions',
            color: 'bg-teal-100 text-teal-700',
            perm: 'approve_checkout'
        },
        {
            id: 'import',
            label: 'Import',
            icon: Download,
            link: '/admin/import',
            color: 'bg-cyan-100 text-cyan-700',
            perm: 'import_data'
        },
    ];

    // Filter and Sort based on Role
    let visibleCards = allCards.filter(card => {
        if (!card.perm) return true;
        return Array.isArray(card.perm) ? hasAnyPermission(user, card.perm) : hasPermission(user, card.perm);
    });

    const roleOrder = {
        'Incharge': ['approvals', 'transactions', 'inventory', 'import', 'roster', 'analytics', 'pending_users'],
        'Volunteer': ['approvals', 'transactions', 'roster', 'my_borrowings', 'catalog'],
        'Student': ['my_borrowings', 'catalog']
    };

    const order = roleOrder[primaryRole] || roleOrder['Student'];

    visibleCards.sort((a, b) => {
        const idxA = order.indexOf(a.id);
        const idxB = order.indexOf(b.id);
        // If both in order list, sort by index
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        // If only A in list, A comes first
        if (idxA !== -1) return -1;
        // If only B in list, B comes first
        if (idxB !== -1) return 1;
        // Otherwise keep original order
        return 0;
    });

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Welcome, {user.name.split(' ')[0]}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                            {primaryRole}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        className={cn("text-gray-500", refreshing && "animate-spin")}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                        {user.name[0]}
                    </div>
                </div>
            </div>

            {/* Hero Checkout Action */}
            <div
                className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 cursor-pointer transform transition-transform active:scale-95"
                onClick={() => setShowCheckout(true)}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Quick Checkout</h2>
                        <p className="text-indigo-100 text-sm">Tap to search for an item</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Quick Actions / Cards Grid */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {visibleCards.map((card) => (
                        <Link to={card.link} key={card.id} className="block group">
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm relative transition-transform group-hover:-translate-y-1", card.color)}>
                                    <card.icon className="w-7 h-7" />
                                    {card.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center leading-tight max-w-[80px]">{card.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* KPI / Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/my-borrowings">
                    <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{stats.active_loans}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Active Loans</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/my-borrowings">
                    <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-rose-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{stats.overdue}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Overdue Items</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Library Status */}
            <Card className={cn("border-l-4 shadow-sm", status?.is_open ? "border-l-emerald-500" : "border-l-rose-500")}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold">Library Status</h2>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                status?.is_open ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {status?.is_open ? 'OPEN' : 'CLOSED'}
                            </span>
                            {hasPermission(user, 'update_library_status') && (
                                <Button size="xs" variant="outline" onClick={() => setShowStatusModal(true)}>
                                    Update
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{status?.message || (status?.is_open ? "Library is open." : "Library is closed.")}</p>
                    <div className="flex flex-col gap-1">
                        {!status?.is_open && status?.next_open && (
                            <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-2" />
                                Opens: {new Date(status.next_open).toLocaleString()}
                            </div>
                        )}
                        {status?.updated_by && (
                            <div className="text-xs text-gray-400 mt-1">
                                Updated by {status.updated_by.name || 'Unknown'} at {new Date(status.updated_at).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Update Status Modal */}
            <BottomSheet
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title="Update Library Status"
                footer={
                    <Button className="w-full" onClick={handleUpdateStatus}>
                        Save Status
                    </Button>
                }
            >
                <div className="space-y-4 p-1">
                    <div className="flex gap-2">
                        <Button
                            variant={newStatus.is_open ? "default" : "outline"}
                            className={cn("flex-1", newStatus.is_open ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                            onClick={() => setNewStatus({ ...newStatus, is_open: true })}
                        >
                            Open
                        </Button>
                        <Button
                            variant={!newStatus.is_open ? "default" : "outline"}
                            className={cn("flex-1", !newStatus.is_open ? "bg-rose-600 hover:bg-rose-700" : "")}
                            onClick={() => setNewStatus({ ...newStatus, is_open: false })}
                        >
                            Closed
                        </Button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Message</label>
                        <Input
                            placeholder="e.g. Will open at 2 PM"
                            value={newStatus.message}
                            onChange={(e) => setNewStatus({ ...newStatus, message: e.target.value })}
                        />
                    </div>
                </div>
            </BottomSheet>

            {/* Today's Volunteers */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                    Today's Volunteers
                </h3>
                {todayRoster ? (
                    <Card className="shadow-sm">
                        <CardContent className="pt-6">
                            <div className="mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</span>
                                <p className="font-medium text-gray-900">{todayRoster.department || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {todayRoster.volunteers.map((vol, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900">{vol ? vol.name : 'Unassigned'}</p>
                                        <p className="text-xs text-gray-500">Volunteer {idx + 1}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                        No schedule found for today.
                    </div>
                )}
            </div>

            {/* Quick Checkout Modal */}
            <QuickCheckout
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
            />

            {/* Debug Info (Temporary for verification) */}
            <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono text-gray-500 overflow-x-auto">
                <p className="font-bold">Debug Info:</p>
                <p>Role: {primaryRole}</p>
                <p>Permissions: {user.permissions?.join(', ') || 'None'}</p>
            </div>
        </div>
    );
};

export default Home;
