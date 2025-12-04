import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Shield, Save, Check, Box, Users, Settings, FileText, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const PERMISSION_CATEGORIES = {
    Inventory: {
        icon: Box,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        permissions: ['manage_inventory', 'view_inventory', 'import_data']
    },
    Transactions: {
        icon: FileText,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        permissions: ['manage_transactions', 'approve_checkout', 'approve_return', 'approve_renew']
    },
    Users: {
        icon: Users,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        permissions: ['manage_users', 'manage_roles_permissions', 'manage_donors', 'manage_roster']
    },
    Settings: {
        icon: Settings,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        permissions: ['manage_settings', 'view_analytics']
    }
};

const ManageRoles = () => {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [activeRole, setActiveRole] = useState(null); // For mobile view focus
    const [expandedCategories, setExpandedCategories] = useState({}); // { roleId: { category: bool } }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/admin/roles'),
                api.get('/admin/permissions')
            ]);
            // Filter out Admin role
            setRoles(rolesRes.data.filter(r => r.name !== 'Admin'));
            setAllPermissions(permsRes.data);

            // Set first role as active for desktop default or mobile initial state
            if (rolesRes.data.length > 0) {
                const firstRole = rolesRes.data.find(r => r.name !== 'Admin');
                if (firstRole) setActiveRole(firstRole.id);
            }
        } catch (error) {
            console.error("Failed to fetch roles data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (roleId, permName) => {
        setRoles(prevRoles => prevRoles.map(role => {
            if (role.id !== roleId) return role;

            const hasPerm = role.permissions.includes(permName);
            let newPerms;
            if (hasPerm) {
                newPerms = role.permissions.filter(p => p !== permName);
            } else {
                newPerms = [...role.permissions, permName];
            }
            return { ...role, permissions: newPerms };
        }));
    };

    const toggleCategory = (roleId, category, shouldSelect) => {
        const categoryPerms = PERMISSION_CATEGORIES[category].permissions;
        setRoles(prevRoles => prevRoles.map(role => {
            if (role.id !== roleId) return role;

            const currentPerms = new Set(role.permissions);
            categoryPerms.forEach(p => {
                if (shouldSelect) currentPerms.add(p);
                else currentPerms.delete(p);
            });
            return { ...role, permissions: Array.from(currentPerms) };
        }));
    };

    const handleSave = async (role) => {
        setSaving(role.id);
        try {
            await api.post(`/admin/roles/${role.id}/permissions`, { permissions: role.permissions });
            // Show success feedback (could be a toast, for now just console)
            console.log("Saved successfully");
        } catch (error) {
            console.error("Failed to save permissions", error);
            alert("Failed to save permissions");
        } finally {
            setSaving(null);
        }
    };

    const toggleCategoryExpand = (roleId, category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [roleId]: {
                ...prev[roleId],
                [category]: !prev[roleId]?.[category]
            }
        }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading roles configuration...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 pb-24 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
                        <p className="text-sm text-gray-500 mt-1">Configure access levels for different user roles</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Role Selector (Sidebar on Desktop, Top on Mobile) */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">Select Role</h3>
                    <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setActiveRole(role.id)}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl text-left transition-all min-w-[200px] lg:min-w-0 border",
                                    activeRole === role.id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    activeRole === role.id ? "bg-white/20" : "bg-gray-100"
                                )}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="font-bold">{role.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Editor */}
                <div className="lg:col-span-9">
                    {roles.map(role => {
                        if (role.id !== activeRole) return null;

                        return (
                            <Card key={role.id} className="border-0 shadow-sm ring-1 ring-gray-200">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-white/80">
                                    <div>
                                        <CardTitle className="text-xl text-gray-900">{role.name} Permissions</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">Manage what {role.name}s can do</p>
                                    </div>
                                    <Button
                                        onClick={() => handleSave(role)}
                                        isLoading={saving === role.id}
                                        className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    {Object.entries(PERMISSION_CATEGORIES).map(([catName, catConfig]) => {
                                        const Icon = catConfig.icon;
                                        const rolePerms = new Set(role.permissions);
                                        const catPerms = catConfig.permissions;
                                        const activeCount = catPerms.filter(p => rolePerms.has(p)).length;
                                        const isAllSelected = activeCount === catPerms.length;
                                        const isExpanded = expandedCategories[role.id]?.[catName] ?? true; // Default expanded

                                        return (
                                            <div key={catName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                {/* Category Header */}
                                                <div className="p-4 bg-gray-50/30 flex items-center justify-between">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer select-none"
                                                        onClick={() => toggleCategoryExpand(role.id, catName)}
                                                    >
                                                        <div className={cn("p-2 rounded-lg", catConfig.bg, catConfig.color)}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{catName}</h4>
                                                            <p className="text-xs text-gray-500">{activeCount} of {catPerms.length} active</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleCategory(role.id, catName, !isAllSelected)}
                                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                                        >
                                                            {isAllSelected ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleCategoryExpand(role.id, catName)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Permissions Grid */}
                                                {isExpanded && (
                                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                                        {catPerms.map(permName => {
                                                            const permDetails = allPermissions.find(p => p.name === permName);
                                                            const isSelected = role.permissions.includes(permName);

                                                            return (
                                                                <label
                                                                    key={permName}
                                                                    className={cn(
                                                                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                                                        isSelected
                                                                            ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                                                                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                                                        isSelected
                                                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                                                            : "bg-white border-gray-300 group-hover:border-gray-400"
                                                                    )}>
                                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="hidden"
                                                                        checked={isSelected}
                                                                        onChange={() => handleTogglePermission(role.id, permName)}
                                                                    />
                                                                    <div>
                                                                        <span className={cn(
                                                                            "block text-sm font-bold mb-0.5",
                                                                            isSelected ? "text-indigo-900" : "text-gray-700"
                                                                        )}>
                                                                            {permName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                        </span>
                                                                        <span className="block text-xs text-gray-500 leading-relaxed">
                                                                            {permDetails?.description || "Controls access to this feature"}
                                                                        </span>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ManageRoles;
