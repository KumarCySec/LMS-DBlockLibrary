import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import {
    Shield, Save, Check, Users, Settings, Box, FileText, Heart,
    Calendar, Lock, AlertTriangle, ChevronRight, Zap, BarChart2,
    Globe, LayoutDashboard, Database, Upload, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';


// --- FEATURE CONFIGURATION ---
// Maps user-friendly features to backend permissions
const FEATURE_GROUPS = [
    {
        id: 'dashboard_ops',
        title: 'Dashboard & Operations',
        description: 'Core daily operations and visibility',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        icon: LayoutDashboard,
        features: [
            {
                id: 'update_library_status',
                label: 'Library Status',
                desc: 'Open/Close library and set status messages',
                perms: ['update_library_status']
            },
            {
                id: 'view_analytics',
                label: 'Analytics Dashboard',
                desc: 'View stats, activity logs, and volunteer metrics',
                perms: ['view_analytics']
            },
            {
                id: 'manage_roster',
                label: 'Duty Roster',
                desc: 'Assign and manage daily volunteer schedules',
                perms: ['manage_roster']
            }
        ]
    },
    {
        id: 'inventory_mgmt',
        title: 'Inventory Management',
        description: 'Books, Equipment, and Donors',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        icon: Box,
        features: [
            {
                id: 'manage_inventory',
                label: 'Manage Items',
                desc: 'Add, edit, or remove books and equipment',
                perms: ['manage_inventory', 'import_data'] // Grouping import with inventory
            },
            {
                id: 'manage_donors',
                label: 'Donor Management',
                desc: 'Track donors and link them to items',
                perms: ['manage_donors']
            }
        ]
    },
    {
        id: 'circulation',
        title: 'Circulation & Transactions',
        description: 'Checkouts, Returns, and Approvals',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        icon: FileText,
        features: [
            {
                id: 'approve_checkout',
                label: 'Approve Checkouts',
                desc: 'Authorize students to borrow items',
                perms: ['approve_checkout']
            },
            {
                id: 'approve_return',
                label: 'Approve Returns',
                desc: 'Verify and accept returned items',
                perms: ['approve_return']
            },
            {
                id: 'approve_renew',
                label: 'Approve Renewals',
                desc: 'Grant due date extensions',
                perms: ['approve_renew']
            },
            {
                id: 'staff_checkout',
                label: 'Staff Auto-Checkout',
                desc: 'Allow self-checkout without approval (for Staff)',
                perms: ['staff_checkout']
            }
        ]
    },
    {
        id: 'user_admin',
        title: 'User Administration',
        description: 'Manage accounts, roles, and depts',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        icon: Users,
        features: [
            {
                id: 'approve_users',
                label: 'Approve Signups',
                desc: ' Verify and approve new student registrations',
                perms: ['approve_users']
            },
            {
                id: 'manage_users',
                label: 'Manage Users',
                desc: 'Edit profiles, view history, and block users',
                perms: ['manage_users']
            },
            {
                id: 'manage_roles',
                label: 'Roles & Permissions',
                desc: 'Configure access levels (This Page)',
                perms: ['manage_roles']
            },
            {
                id: 'manage_departments',
                label: 'Departments',
                desc: 'Add or edit academic departments',
                perms: ['manage_departments']
            }
        ]
    },
    {
        id: 'system_critical',
        title: 'System & Security',
        description: 'Critical settings and dangerous actions',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        icon: Shield,
        features: [
            {
                id: 'manage_settings',
                label: 'Global Settings',
                desc: 'Configure due dates, fines, and system details',
                perms: ['manage_settings']
            },
            {
                id: 'manage_system_reset',
                label: 'System Reset',
                desc: 'Access to wipe data/transactions (Danger Zone)',
                perms: ['manage_system_reset']
            }
        ]
    }
];

const ManageRoles = () => {
    const { user, refreshProfile } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRole] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/admin/roles');
            // Filter out 'Admin' role to prevent locking yourself out, 
            // or just render it read-only. Let's filter it out for safety as per standard practice.
            const editableRoles = res.data.filter(r => r.name !== 'Admin');
            setRoles(editableRoles);

            if (editableRoles.length > 0 && !activeRole) {
                setActiveRole(editableRoles[0].id);
            }
        } catch (error) {
            console.error("Failed to load roles", error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentRole = () => roles.find(r => r.id === activeRole);

    // Toggle a Feature (which might be 1+ permissions)
    const toggleFeature = (feature) => {
        if (!activeRole) return;

        setRoles(prevRoles => prevRoles.map(role => {
            if (role.id !== activeRole) return role;

            const currentPerms = new Set(role.permissions);
            const featurePerms = feature.perms;

            // Check if fully active
            const isActive = featurePerms.every(p => currentPerms.has(p));

            if (isActive) {
                // Remove all perms for this feature
                featurePerms.forEach(p => currentPerms.delete(p));
            } else {
                // Add all perms for this feature
                featurePerms.forEach(p => currentPerms.add(p));
            }

            return { ...role, permissions: Array.from(currentPerms) };
        }));
        setHasChanges(true);
    };

    // Toggle entire Group
    const toggleGroup = (group) => {
        if (!activeRole) return;

        setRoles(prevRoles => prevRoles.map(role => {
            if (role.id !== activeRole) return role;

            const currentPerms = new Set(role.permissions);
            const allGroupPerms = group.features.flatMap(f => f.perms);

            // Check if ALL are active
            const isAllActive = allGroupPerms.every(p => currentPerms.has(p));

            if (isAllActive) {
                // Deselect All
                allGroupPerms.forEach(p => currentPerms.delete(p));
            } else {
                // Select All
                allGroupPerms.forEach(p => currentPerms.add(p));
            }

            return { ...role, permissions: Array.from(currentPerms) };
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const roleToSave = getCurrentRole();
        if (!roleToSave) return;

        setSaving(true);
        try {
            await api.post(`/admin/roles/${roleToSave.id}/permissions`, {
                permissions: roleToSave.permissions
            });
            await refreshProfile(); // Update local context if I'm editing my own role
            setHasChanges(false);
            // Optional: Toast success
            alert(`Permissions updated for ${roleToSave.name}`);
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const currentRoleData = getCurrentRole();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Roles & Access</h1>
                        <p className="text-sm text-gray-500 font-medium">Configure capabilities for each user role</p>
                    </div>
                </div>

                {hasChanges && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Button
                            onClick={handleSave}
                            isLoading={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        >
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Sidebar: Role Selector - Sticky & Better Scroll on Mobile */}
                <div className="lg:col-span-3 space-y-4 sticky top-0 lg:top-6 z-30 pt-4 lg:pt-0 bg-gray-50/95 backdrop-blur-sm lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 border-b lg:border-none border-gray-200 lg:shadow-none pb-4 lg:pb-0">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Role</h3>

                    </div>
                    <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar snap-x">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setActiveRole(role.id)}
                                className={cn(
                                    "relative snap-start flex items-center gap-3 p-3 lg:p-4 rounded-xl text-left transition-all min-w-[140px] lg:min-w-0 border w-full active:scale-95 duration-200",
                                    activeRole === role.id
                                        ? "bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600 z-10"
                                        : "bg-white border-gray-100 hover:bg-gray-50 text-gray-600 shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    activeRole === role.id ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
                                )}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={cn("block font-bold truncate", activeRole === role.id ? "text-indigo-900" : "text-gray-700")}>
                                        {role.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {role.permissions.length} perms active
                                    </span>
                                </div>
                                {activeRole === role.id && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                )}
                            </button>
                        ))}

                        {/* Admin Info Card */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed">
                            <div className="flex items-center gap-2 mb-1">
                                <Lock className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-gray-700">Admin</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">Full access. Cannot be edited.</p>
                        </div>
                    </div>
                </div>

                {/* Main Content: Permission Matrix */}
                <div className="lg:col-span-9 space-y-6">
                    {currentRoleData ? (
                        <div className="animate-in fade-in duration-300 space-y-6">

                            {FEATURE_GROUPS.map(group => {
                                const GroupIcon = group.icon;
                                // Calculate group status
                                const groupPerms = group.features.flatMap(f => f.perms);
                                const activeCount = groupPerms.filter(p => currentRoleData.permissions.includes(p)).length;
                                const isFull = activeCount === groupPerms.length;
                                const isPartial = activeCount > 0 && !isFull;

                                return (
                                    <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                                        {/* Group Header */}
                                        <div className="p-4 md:p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2.5 rounded-xl", group.bg, group.color)}>
                                                    <GroupIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{group.title}</h3>
                                                    <p className="text-xs text-gray-500 hidden md:block">{group.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleGroup(group)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border",
                                                    isFull
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                )}
                                            >
                                                {isFull ? 'Disable Group' : 'Enable Group'}
                                            </button>
                                        </div>

                                        {/* Features Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-1 p-1">
                                            {group.features.map(feature => {
                                                const isActive = feature.perms.every(p => currentRoleData.permissions.includes(p));

                                                return (
                                                    <div
                                                        key={feature.id}
                                                        onClick={() => toggleFeature(feature)}
                                                        className={cn(
                                                            "relative p-4 rounded-xl cursor-pointer transition-all border flex items-start gap-3 group/item",
                                                            isActive
                                                                ? "bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50/50"
                                                                : "bg-white border-transparent hover:bg-gray-50"
                                                        )}
                                                    >
                                                        {/* Checkbox Visual */}
                                                        <div className={cn(
                                                            "mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                                            isActive
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                                : "bg-white border-gray-300 group-hover/item:border-indigo-300"
                                                        )}>
                                                            {isActive && <Check className="w-3.5 h-3.5" />}
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={cn("text-sm font-bold", isActive ? "text-indigo-900" : "text-gray-700")}>
                                                                    {feature.label}
                                                                </h4>
                                                                {feature.id === 'manage_system_reset' && (
                                                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                {feature.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Select a role to configure
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageRoles;
