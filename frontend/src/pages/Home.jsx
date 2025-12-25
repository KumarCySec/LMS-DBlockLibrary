import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    CheckCircle, UserPlus, Bell, Clock, Activity, Loader2, Calendar,
    Users, Phone, Mail, Building, Zap, Search, Package, BarChart2,
    History, BookOpen, Settings, Upload, FileText, UserCog, Heart, Shield, X, Banknote, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getPrimaryRole, hasAnyPermission } from '../utils/permissions';
import FlyingAnnouncement from '../components/FlyingAnnouncement';
import QuickCheckout from '../components/QuickCheckout';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active_loans: 0, overdue: 0, pending_approvals: 0, my_transactions: [] });
    const [status, setStatus] = useState(null);
    const [roster, setRoster] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [activeUsersModalOpen, setActiveUsersModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);

    const [statusModalOpen, setStatusModalOpen] = useState(false);

    const handleStatusClick = () => {
        if (hasAnyPermission(user, ['update_library_status'])) {
            setStatusModalOpen(true);
        } else if (status?.is_open) {
            setActiveUsersModalOpen(true);
        }
    };

    const handleStatusUpdate = async (isOpen, message) => {
        try {
            await api.post('/common/status', { is_open: isOpen, message });
            await fetchData();
            setStatusModalOpen(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const fetchData = async () => {
        try {
            // Public/Common endpoints
            const commonPromises = [
                api.get('/common/status'),
                api.get('/roster/today'),
                api.get('/attendance/active'),
                api.get('/transactions/my')
            ];

            const [statusRes, rosterRes, activeRes, myTxsRes] = await Promise.all(commonPromises);

            setStatus(statusRes.data);
            setRoster(rosterRes.data);
            setActiveUsers(activeRes.data || []);

            const myTxs = myTxsRes.data || [];
            const activeLoans = myTxs.filter(t => t.status === 'ISSUED').length;
            const overdue = myTxs.filter(t => t.status === 'OVERDUE' || (t.status === 'ISSUED' && new Date(t.due_date) < new Date())).length;

            // Admin-only endpoints (Pending Users)
            let pendingCount = 0;
            if (hasAnyPermission(user, ['approve_users'])) {
                try {
                    const pendingRes = await api.get('/users/?status=pending_approval');
                    pendingCount = pendingRes.data.length;
                } catch (e) {
                    console.warn("Failed to fetch pending users", e);
                }
            }

            setStats({
                active_loans: activeLoans,
                overdue: overdue,
                pending_approvals: pendingCount,
                my_transactions: myTxs
            });

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
            // Poll every 10 seconds to keep status in sync
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;
    }

    const primaryRole = getPrimaryRole(user);

    // Normalize data for display
    const todayRoster = roster ? {
        ...roster,
        department: roster.department?.name,
        volunteers: [roster.volunteer1, roster.volunteer2].filter(Boolean)
    } : null;

    // Comprehensive Quick Actions List
    const quickActions = [
        {
            id: 'attendance',
            label: 'Attendance',
            icon: Clock,
            link: '/attendance',
            color: 'bg-pink-100 text-pink-600',
            perm: ['manage_roster', 'view_analytics', 'update_library_status']
        },
        {
            id: 'approvals',
            label: 'Approvals',
            icon: CheckCircle,
            link: '/approvals',
            color: 'bg-emerald-100 text-emerald-600',
            perm: ['approve_checkout', 'approve_return', 'approve_renew']
        },
        {
            id: 'transactions',
            label: 'History',
            icon: History,
            link: '/admin/transactions',
            color: 'bg-teal-100 text-teal-600',
            perm: ['manage_inventory', 'approve_checkout']
        },
        {
            id: 'roster',
            label: 'Roster',
            icon: Calendar,
            link: '/admin/roster',
            color: 'bg-orange-100 text-orange-600',
            perm: ['manage_roster']
        },
        {
            id: 'pending_users',
            label: 'Pending',
            icon: UserPlus,
            link: '/admin/pending-approvals',
            color: 'bg-yellow-100 text-yellow-600',
            badge: stats.pending_approvals > 0 ? stats.pending_approvals : null,
            perm: ['approve_users']
        },
        {
            id: 'roles',
            label: 'Roles',
            icon: Shield,
            link: '/admin/roles',
            color: 'bg-gray-100 text-gray-600',
            perm: ['manage_roles']
        },
        {
            id: 'manage_users',
            label: 'Users',
            icon: UserCog,
            link: '/admin/users',
            color: 'bg-cyan-100 text-cyan-600',
            perm: ['manage_users', 'approve_users']
        },
        {
            id: 'departments',
            label: 'Depts',
            icon: Building,
            link: '/admin/departments',
            color: 'bg-blue-100 text-blue-600',
            perm: ['manage_departments']
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: Package,
            link: '/admin/inventory',
            color: 'bg-purple-100 text-purple-600',
            perm: ['manage_inventory']
        },
        {
            id: 'manage_donors',
            label: 'Donors',
            icon: Heart,
            link: '/admin/donors',
            color: 'bg-red-100 text-red-600',
            perm: ['manage_donors']
        },
        {
            id: 'announcements',
            label: 'Announce',
            icon: Bell,
            link: '/admin/announcements',
            color: 'bg-indigo-100 text-indigo-600',
            perm: ['manage_settings']
        },
        {
            id: 'import',
            label: 'Import',
            icon: Upload,
            link: '/admin/import',
            color: 'bg-lime-100 text-lime-600',
            perm: ['manage_inventory']
        },
        {
            id: 'my_items',
            label: 'My Items',
            icon: BookOpen,
            link: '/my-borrowings',
            color: 'bg-blue-100 text-blue-600',
            perm: null // All users
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart2,
            link: '/admin/analytics',
            color: 'bg-rose-100 text-rose-600',
            perm: ['view_analytics']
        },
        {
            id: 'volunteer_stats',
            label: 'Vol Stats', // Short label
            icon: Users, // Reusing Users icon or Trophy
            link: '/admin/volunteer-analytics',
            color: 'bg-emerald-100 text-emerald-600',
            perm: ['view_analytics']
        },
        {
            id: 'activity',
            label: 'Activity',
            icon: Activity,
            link: '/admin/activity',
            color: 'bg-amber-100 text-amber-600',
            perm: ['view_analytics']
        },
        {
            id: 'system_reset',
            label: 'Sys Reset',
            icon: AlertTriangle,
            link: '/admin/system-reset',
            color: 'bg-red-100 text-red-600',
            perm: ['manage_system_reset']
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            link: '/admin/settings',
            color: 'bg-slate-100 text-slate-600',
            perm: ['manage_settings']
        },
        {
            id: 'payments',
            label: 'Payments',
            icon: Banknote,
            link: '/payments',
            color: 'bg-green-100 text-green-600',
            perm: null // For everyone
        }
    ];

    const visibleActions = quickActions.filter(action => {
        if (!action.perm) return true;
        return hasAnyPermission(user, action.perm);
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <FlyingAnnouncement />

            {/* Desktop: Grid Layout, Mobile: Flex Column */}
            <div className="max-w-xl mx-auto md:max-w-none px-4 pt-6 space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">

                {/* Header - Full Width */}
                <div className="md:col-span-3 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <span>Welcome, {user?.name.split(' ')[0]}</span>
                            <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700">{primaryRole}</span>
                        </div>
                    </div>
                </div>

                {/* 1. Hero Section: Quick Checkout (2/3 Width on Desktop) */}
                <div
                    onClick={() => setShowCheckout(true)}
                    className="md:col-span-2 relative cursor-pointer group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-center min-h-[160px]"
                >
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Quick Checkout</h2>
                            <p className="text-indigo-100 text-sm md:text-base">Tap to search & issue items instantly.</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-xl"></div>
                </div>

                {/* Stats Row (1/3 Width on Desktop - Stacked) */}
                <div className="md:col-span-1 grid grid-cols-2 md:grid-cols-1 gap-4">
                    <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between h-full">
                            <div>
                                <span className="text-xl md:text-2xl font-bold text-gray-900 block">{stats.active_loans}</span>
                                <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">Active Loans</span>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between h-full">
                            <div>
                                <span className="text-xl md:text-2xl font-bold text-gray-900 block">{stats.overdue}</span>
                                <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">Overdue</span>
                            </div>
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <Activity className="w-5 h-5 text-rose-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Live Status Card (Full Width) */}
                <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                    {/* Left: Library Status & Controls */}
                    <div className="md:w-1/2 flex flex-col justify-center">
                        <div
                            className="flex justify-between items-center mb-2 cursor-pointer active:opacity-70 transition-opacity"
                            onClick={handleStatusClick}
                        >
                            <h3 className="font-bold text-gray-900">Library Status</h3>
                            {status?.is_open ? (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">OPEN</span>
                            ) : (
                                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">CLOSED</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1" onClick={() => setActiveUsersModalOpen(true)}>
                            <div className="flex -space-x-2 cursor-pointer hover:scale-105 transition-transform">
                                {activeUsers.slice(0, 3).map((u, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                        {u.name[0]}
                                    </div>
                                ))}
                                {activeUsers.length === 0 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-400">
                                        <Users className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-gray-500 font-medium cursor-pointer hover:text-indigo-600 hover:underline">
                                {activeUsers.length > 0 ? `${activeUsers.length} Volunteers on duty` : "No one currently punched in"}
                            </span>
                        </div>
                    </div>

                    {/* Right: Today's Scheduler (Roster) */}
                    <div className="md:w-1/2 pt-4 md:pt-0 md:pl-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {roster ? `${roster.department?.name || 'ASSIGNED'} ON DUTY` : 'NO ROSTER SCHEDULED'}
                            </span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                            {todayRoster && todayRoster.volunteers.length > 0 ? (
                                todayRoster.volunteers.map((vol, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => vol && setSelectedUser(vol)}
                                        className="flex items-center gap-2 bg-gray-50 pr-3 rounded-full cursor-pointer hover:bg-indigo-50 transition-colors shrink-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {vol.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900 leading-none">{vol.name}</span>
                                            <span className="text-[9px] text-gray-500">Vol {idx + 1}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">
                                    {roster ? "Volunteers not linked to accounts" : "No volunteers assigned for today"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions Grid (Last) - Full Width */}
                <div className="md:col-span-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6 pb-24 md:pb-0">
                        {visibleActions.map(action => (
                            <div
                                key={action.id}
                                onClick={() => navigate(action.link)}
                                className="flex flex-col items-center gap-2 cursor-pointer group relative"
                            >
                                <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:-translate-y-1 group-active:scale-95", action.color)}>
                                    <action.icon className="w-6 h-6 md:w-7 md:h-7" />
                                </div>
                                <span className="text-xs font-medium text-gray-600 text-center truncate w-full group-hover:text-indigo-600 transition-colors">{action.label}</span>
                                {action.badge && (
                                    <span className="absolute top-0 right-1 translate-x-1/2 -translate-y-1/4 bg-rose-500 text-white chat-xs font-bold px-1.5 rounded-full border-2 border-white shadow-sm">
                                        {action.badge}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Status Update Modal */}
            {statusModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Update Library Status</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleStatusUpdate(true, "Library is Open")}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5" /> Open Library
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(false, "Library Closed")}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-rose-100 text-rose-700 rounded-xl font-bold hover:bg-rose-200 transition-colors"
                            >
                                <X className="w-5 h-5" /> Close Library
                            </button>
                            <div className="my-2 border-t border-gray-100"></div>
                            <button
                                onClick={() => setStatusModalOpen(false)}
                                className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Users Modal */}
            {activeUsersModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Currently On Duty
                            </h3>
                            <button onClick={() => setActiveUsersModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {activeUsers.length > 0 ? (
                                activeUsers.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">Checked in at {new Date(user.check_in + (user.check_in.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">No volunteers currently checked in.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400">Tracking real-time attendance</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white relative">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-sm transition-colors"
                            >
                                <span className="sr-only">Close</span>
                                ✕
                            </button>
                            <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold shadow-xl border-4 border-white/20">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{selectedUser.name}</h3>
                            <p className="text-indigo-100 font-medium">{selectedUser.role || 'Volunteer'}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {[
                                { icon: Phone, label: 'Phone', value: selectedUser.phone, link: `tel:${selectedUser.phone}` },
                                { icon: Mail, label: 'Email', value: selectedUser.email, link: `mailto:${selectedUser.email}` },
                                { icon: Building, label: 'Department', value: selectedUser.department || 'N/A' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:text-indigo-700 group-hover:scale-110 transition-all">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">{item.label}</p>
                                        {item.link ? (
                                            <a href={item.link} className="font-bold text-gray-900 hover:text-indigo-600 truncate block">
                                                {item.value || 'N/A'}
                                            </a>
                                        ) : (
                                            <p className="font-bold text-gray-900 truncate">{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <QuickCheckout
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
            />
        </div>
    );
};

export default Home;
