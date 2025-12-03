import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Trash2, Plus, Building, Edit } from 'lucide-react';

const ManageDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDeptName, setNewDeptName] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/common/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        setAdding(true);
        try {
            const response = await api.post('/admin/departments', { name: newDeptName });
            setDepartments([...departments, { id: response.data.id, name: newDeptName }]);
            setNewDeptName('');
        } catch (error) {
            console.error("Failed to add department", error);
            alert(error.response?.data?.error || "Failed to add department");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This might fail if users are assigned to this department.")) return;

        try {
            await api.delete(`/admin/departments/${id}`);
            setDepartments(departments.filter(d => d.id !== id));
        } catch (error) {
            console.error("Failed to delete department", error);
            alert(error.response?.data?.error || "Failed to delete department");
        }
    };

    const startEdit = (dept) => {
        setEditingId(dept.id);
        setEditName(dept.name);
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/admin/departments/${id}`, { name: editName });
            setDepartments(departments.map(d => d.id === id ? { ...d, name: editName } : d));
            setEditingId(null);
        } catch (error) {
            alert("Failed to update department");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Building className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Department</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            placeholder="Department Name (e.g. CSE)"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                        />
                        <Button type="submit" isLoading={adding} disabled={!newDeptName.trim()}>
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <Card key={dept.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex justify-between items-center">
                            {editingId === dept.id ? (
                                <div className="flex gap-2 w-full">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-8"
                                    />
                                    <Button size="sm" onClick={() => handleUpdate(dept.id)}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-900">{dept.name}</span>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-gray-500 hover:text-indigo-600"
                                            onClick={() => startEdit(dept)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => handleDelete(dept.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ManageDepartments;
