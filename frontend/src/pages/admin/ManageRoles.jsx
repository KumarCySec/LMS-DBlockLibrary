import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Shield, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

const ManageRoles = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // role id being saved

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/admin/roles'),
                api.get('/admin/permissions')
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
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

    const handleSave = async (role) => {
        setSaving(role.id);
        try {
            await api.post(`/admin/roles/${role.id}/permissions`, { permissions: role.permissions });
            // Optional: Show success toast
        } catch (error) {
            console.error("Failed to save permissions", error);
            alert("Failed to save permissions");
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            </div>

            <div className="space-y-6">
                {roles.map((role) => (
                    <Card key={role.id}>
                        <CardHeader className="pb-2 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg text-indigo-700">{role.name}</CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => handleSave(role)}
                                    isLoading={saving === role.id}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {permissions.map((perm) => (
                                    <label key={perm.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            checked={role.permissions.includes(perm.name)}
                                            onChange={() => handleTogglePermission(role.id, perm.name)}
                                        />
                                        <div>
                                            <span className="block text-sm font-medium text-gray-900">{perm.name}</span>
                                            <span className="block text-xs text-gray-500">{perm.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ManageRoles;
