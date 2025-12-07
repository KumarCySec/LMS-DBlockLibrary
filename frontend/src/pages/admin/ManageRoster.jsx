import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Calendar, User as UserIcon, Save } from 'lucide-react';

const ManageRoster = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [roster, setRoster] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]); // Users in selected department
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState('');

    const filteredUsers = users.filter(u => !selectedBatch || u.batch === selectedBatch);

    const [formData, setFormData] = useState({
        department_id: '',
        volunteer_1_id: '',
        volunteer_2_id: ''
    });

    useEffect(() => {
        fetchDepartments();
        fetchRoster();
    }, [selectedDate]);

    useEffect(() => {
        if (formData.department_id) {
            fetchUsersByDept(formData.department_id);
        } else {
            setUsers([]);
        }
    }, [formData.department_id]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/common/departments');
            setDepartments(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRoster = async () => {
        try {
            const res = await api.get(`/roster/?start_date=${selectedDate}&end_date=${selectedDate}`);
            if (res.data && res.data.length > 0) {
                const r = res.data[0];
                setRoster(r);
                setFormData({
                    department_id: r.department?.id || '',
                    volunteer_1_id: r.volunteer1?.id || '',
                    volunteer_2_id: r.volunteer2?.id || ''
                });
            } else {
                setRoster(null);
                setFormData({ department_id: '', volunteer_1_id: '', volunteer_2_id: '' });
            }
        } catch (e) { console.error(e); }
    };

    const fetchUsersByDept = async (deptId) => {
        try {
            // Fetch students/staff from this dept
            const res = await api.get(`/users/?department_id=${deptId}&status=approved`);
            setUsers(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!formData.department_id || !formData.volunteer_1_id) {
            alert("Department and at least 1 Volunteer are required");
            return;
        }
        setLoading(true);
        try {
            await api.post('/roster/', {
                date: selectedDate,
                ...formData
            });
            fetchRoster();
            alert("Roster updated!");
        } catch (e) {
            alert("Failed to update roster");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Duty Roster Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Date Selection */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5" /> Select Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                        />
                        <div className="mt-4 text-sm text-gray-500">
                            <p>Current Assignment:</p>
                            {roster ? (
                                <div className="mt-2 p-3 bg-green-50 rounded border border-green-100">
                                    <p className="font-bold text-green-800">{roster.department?.name}</p>
                                    <p
                                        className="text-green-700 cursor-pointer hover:underline"
                                        onClick={() => setSelectedUser(roster.volunteer1)}
                                    >
                                        {roster.volunteer1?.name}
                                    </p>
                                    {roster.volunteer2 && (
                                        <p
                                            className="text-green-700 cursor-pointer hover:underline"
                                            onClick={() => setSelectedUser(roster.volunteer2)}
                                        >
                                            {roster.volunteer2?.name}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-2 italic">No roster set for this date.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-bold mb-4">Volunteer Details</h3>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Name:</span> {selectedUser.name}</p>
                                <p><span className="font-semibold">Phone:</span> {selectedUser.phone || 'N/A'}</p>
                                <p><span className="font-semibold">Email:</span> {selectedUser.email || 'N/A'}</p>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={() => setSelectedUser(null)}>Close</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right: Assignment Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5" /> Assign Volunteers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department In-Charge</label>
                            <select
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value, volunteer_1_id: '', volunteer_2_id: '' })}
                                className="w-full p-2 border rounded-lg bg-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Batch</label>
                            <Input
                                type="text"
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                placeholder="Enter Batch (e.g. 2024)"
                                disabled={!formData.department_id}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer 1 (Primary)</label>
                                <select
                                    value={formData.volunteer_1_id}
                                    onChange={(e) => setFormData({ ...formData, volunteer_1_id: e.target.value })}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    disabled={!formData.department_id}
                                >
                                    <option value="">Select User</option>
                                    {filteredUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.roll_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer 2 (Secondary)</label>
                                <select
                                    value={formData.volunteer_2_id}
                                    onChange={(e) => setFormData({ ...formData, volunteer_2_id: e.target.value })}
                                    className="w-full p-2 border rounded-lg bg-white"
                                    disabled={!formData.department_id}
                                >
                                    <option value="">Select User (Optional)</option>
                                    {filteredUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.roll_number})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button onClick={handleSave} isLoading={loading} className="w-full md:w-auto">
                                <Save className="w-4 h-4 mr-2" /> Save Roster
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ManageRoster;
