import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Users, Shield, Building, Heart, Package, Calendar,
    BarChart2, Settings, UserPlus, CheckCircle, AlertCircle, Clock, Upload, ArrowLeftRight, Bell, Activity, Power, Phone, Mail, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, hasAnyPermission } from '../../utils/permissions';

const AdminDashboard = () => {
    const { user } = useAuth();
    // ... (state declarations remain same)

    // ... (useEffect and other functions remain same)

    const managementModules = [
        { title: 'Transactions', icon: ArrowLeftRight, link: '/admin/transactions', color: 'bg-indigo-50 text-indigo-700', desc: 'History & Approvals', perm: 'approve_checkout' },
        { title: 'Users', icon: Users, link: '/admin/users', color: 'bg-blue-100 text-blue-700', desc: 'Manage students & staff', perm: 'manage_users' },
        { title: 'Roles & Perms', icon: Shield, link: '/admin/roles', color: 'bg-indigo-100 text-indigo-700', desc: 'Configure access control', perm: 'manage_roles' },
        { title: 'Departments', icon: Building, link: '/admin/departments', color: 'bg-purple-100 text-purple-700', desc: 'Manage departments', perm: 'manage_departments' },
        { title: 'Donors', icon: Heart, link: '/admin/donors', color: 'bg-rose-100 text-rose-700', desc: 'Track donors & contributions', perm: 'manage_donors' },
        { title: 'Inventory', icon: Package, link: '/admin/inventory', color: 'bg-emerald-100 text-emerald-700', desc: 'Books, kits, laptops', perm: 'manage_inventory' },
        { title: 'Roster', icon: Calendar, link: '/admin/roster', color: 'bg-orange-100 text-orange-700', desc: 'Volunteer schedule', perm: 'manage_roster' },
        { title: 'Attendance', icon: Clock, link: '/attendance', color: 'bg-pink-100 text-pink-700', desc: 'Mark attendance', perm: ['update_library_status', 'manage_roster', 'view_analytics'] },
        { title: 'Analytics', icon: BarChart2, link: '/admin/analytics', color: 'bg-cyan-100 text-cyan-700', desc: 'Usage reports', perm: 'view_analytics' },
        { title: 'Settings', icon: Settings, link: '/admin/settings', color: 'bg-gray-100 text-gray-700', desc: 'Global configuration', perm: 'manage_settings' },
        { title: 'Announcements', icon: Bell, link: '/admin/announcements', color: 'bg-indigo-100 text-indigo-700', desc: 'Broadcast messages', perm: 'manage_settings' },
        { title: 'Activity Log', icon: Activity, link: '/admin/activity', color: 'bg-orange-100 text-orange-700', desc: 'Audit trail', perm: 'view_analytics' },
        { title: 'Import Data', icon: Upload, link: '/admin/import', color: 'bg-teal-100 text-teal-700', desc: 'Import CSV data', perm: 'manage_inventory' },
    ];

    const visibleModules = managementModules.filter(mod => {
        return Array.isArray(mod.perm) ? hasAnyPermission(user, mod.perm) : hasPermission(user, mod.perm);
    });

    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-sm text-gray-500">Super Admin Control Center ({user?.role})</p>
                </div>
            </div>

            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Library Status Card - Redesigned */}
                <Card
                    onClick={() => libraryStatus?.is_open && setActiveUsersModalOpen(true)}
                    className={`border-0 shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer ${libraryStatus?.is_open ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-gradient-to-br from-gray-700 to-gray-900 text-white'}`}
                >
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Library Status</p>
                                <h3 className="text-2xl font-black mt-1">
                                    {libraryStatus?.is_open ? 'OPEN' : 'CLOSED'}
                                </h3>
                            </div>
                            <div className={`p-2 rounded-full ${libraryStatus?.is_open ? 'bg-white/20' : 'bg-white/10'}`}>
                                <Power className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Active Users Preview */}
                        {libraryStatus?.is_open && (
                            <div className="mb-4">
                                <p className="text-xs font-medium opacity-90 mb-1">Currently Active</p>
                                <div className="flex -space-x-2">
                                    {activeUsers.slice(0, 4).map((u, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center text-xs font-bold border-2 border-emerald-500" title={u.name}>
                                            {u.name[0]}
                                        </div>
                                    ))}
                                    {activeUsers.length > 4 && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold border-2 border-emerald-500">
                                            +{activeUsers.length - 4}
                                        </div>
                                    )}
                                    {activeUsers.length === 0 && <span className="text-xs opacity-70">No volunteers checked in</span>}
                                </div>
                            </div>
                        )}

                        {hasPermission(user, 'update_library_status') && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    setStatusModalOpen(true);
                                }}
                                className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                            >
                                {libraryStatus?.is_open ? 'Close Library' : 'Open Library'}
                            </Button>
                        )}
                    </CardContent>
                    {/* Background Pattern */}
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                        <Clock className="w-32 h-32" />
                    </div>
                </Card>

                {/* KPI Cards */}
                <Link to="/admin/pending-approvals">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-amber-500 h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Pending Users</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.pending_approvals}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <UserPlus className="w-6 h-6 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/outstanding">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Active Loans</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.active_checkouts}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="border-l-4 border-l-rose-500 h-full">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Overdue Items</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.overdue_items}</h3>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-rose-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Roster - Enhanced */}
            {todayRoster && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Today's Duty Roster
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[todayRoster.volunteer1, todayRoster.volunteer2].filter(Boolean).map((vol, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedUser(vol)}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                                            {vol.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-indigo-700">{vol.name}</p>
                                            <p className="text-xs text-gray-500">{vol.department || 'Volunteer'}</p>
                                        </div>
                                    </div>
                                ))}
                                {!todayRoster.volunteer1 && !todayRoster.volunteer2 && (
                                    <p className="text-gray-500 text-sm italic">No volunteers scheduled for today.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Active Users Modal */}
            {activeUsersModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" />
                                Active Volunteers
                            </h3>
                            <button onClick={() => setActiveUsersModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {activeUsers.length > 0 ? (
                                activeUsers.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">Checked in at {new Date(user.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No volunteers currently checked in.</p>
                                </div>
                            )}
                        </div>

                        <Button onClick={() => setActiveUsersModalOpen(false)} className="w-full mt-6" variant="outline">
                            Close
                        </Button>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {libraryStatus?.is_open ? 'Close Library' : 'Open Library'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    rows="3"
                                    placeholder={libraryStatus?.is_open ? "e.g. Closing for lunch break..." : "e.g. Open for regular hours..."}
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStatusModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`flex-1 ${libraryStatus?.is_open ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    onClick={handleStatusUpdate}
                                    isLoading={loading}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info Modal - Enhanced */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-0 rounded-2xl shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center text-white relative">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10"
                            >
                                <span className="sr-only">Close</span>
                                ✕
                            </button>
                            <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold shadow-lg">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                            <p className="text-indigo-100 text-sm">{selectedUser.role || 'Volunteer'}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full shadow-sm text-indigo-600">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                    <a href={`tel:${selectedUser.phone}`} className="font-medium text-gray-900 hover:text-indigo-600">
                                        {selectedUser.phone || 'N/A'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full shadow-sm text-indigo-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                    <a href={`mailto:${selectedUser.email}`} className="font-medium text-gray-900 hover:text-indigo-600 break-all">
                                        {selectedUser.email || 'N/A'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full shadow-sm text-indigo-600">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Department</p>
                                    <p className="font-medium text-gray-900">{selectedUser.department || 'N/A'}</p>
                                </div>
                            </div>

                            <Button onClick={() => setSelectedUser(null)} className="w-full mt-2">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Management Grid */}
            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {visibleModules.map((mod, idx) => (
                        <Link to={mod.link} key={idx}>
                            <Card className="hover:shadow-lg transition-all duration-200 h-full border-transparent hover:border-indigo-100 group">
                                <CardContent className="p-4 flex flex-col items-center text-center h-full justify-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${mod.color}`}>
                                        <mod.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">{mod.title}</h3>
                                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{mod.desc}</p>
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
