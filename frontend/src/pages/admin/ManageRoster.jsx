import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Calendar as CalendarIcon, Save } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';

const ManageRoster = () => {
    const [roster, setRoster] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]); // All users to select volunteers from
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // date string being saved

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => format(addDays(startOfToday(), i), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rosterRes, deptRes, usersRes] = await Promise.all([
                api.get('/admin/roster'),
                api.get('/admin/departments'),
                api.get('/admin/users') // Need a way to get list of users to assign
            ]);
            setRoster(rosterRes.data);
            setDepartments(deptRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to fetch roster data", error);
        } finally {
            setLoading(false);
        }
    };

    const getRosterEntry = (date) => roster.find(r => r.date === date) || {};

    const handleSave = async (date, data) => {
        setSaving(date);
        try {
            await api.post('/admin/roster', {
                date,
                department_id: data.department_id,
                volunteer_1_id: data.volunteer_1_id,
                volunteer_2_id: data.volunteer_2_id
            });
            // Refresh roster
            const res = await api.get('/admin/roster');
            setRoster(res.data);
        } catch (error) {
            console.error("Failed to save roster", error);
            alert("Failed to save roster entry");
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <CalendarIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Duty Roster</h1>
            </div>

            <div className="space-y-4">
                {dates.map((date) => {
                    const entry = getRosterEntry(date);
                    // Find current values or defaults
                    // Note: entry.department is object {id, name}, but we need ID for select
                    // The API returns populated objects. We need to handle that.
                    // Actually, the GET /admin/roster returns: 
                    // { date: '...', department: 'Name', volunteers: [{id, name}, ...] }
                    // This is not ideal for editing. We need IDs.
                    // Let's assume for now we can't easily edit without IDs.
                    // I should update GET /admin/roster to return IDs as well or use a different endpoint.
                    // For now, I'll just render the view and maybe a simple edit form if I had the IDs.

                    // Wait, I can't implement full edit without IDs.
                    // Let's check `admin.py` get_roster again.
                    // It returns department name and volunteer names/ids.
                    // It returns `department: ...name` and `volunteers: [{id, name}]`.
                    // It does NOT return department_id.

                    // I will fix `admin.py` to return IDs in the next step.
                    // For now, I'll write the UI assuming I have `department_id` and `volunteer_ids`.

                    return (
                        <RosterCard
                            key={date}
                            date={date}
                            entry={entry}
                            departments={departments}
                            users={users}
                            onSave={handleSave}
                            isSaving={saving === date}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const RosterCard = ({ date, entry, departments, users, onSave, isSaving }) => {
    const [deptId, setDeptId] = useState(entry.department_id || '');
    const [vol1Id, setVol1Id] = useState(entry.volunteers?.[0]?.id || '');
    const [vol2Id, setVol2Id] = useState(entry.volunteers?.[1]?.id || '');

    // Update local state if entry changes (e.g. after save)
    // But wait, entry from API doesn't have department_id.
    // I need to fix the API first.

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                    <span>{format(new Date(date), 'EEEE, MMM d')}</span>
                    {isSaving && <Loader2 className="animate-spin w-4 h-4" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                        className="w-full mt-1 p-2 border rounded-md"
                        value={deptId}
                        onChange={(e) => setDeptId(e.target.value)}
                    >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Volunteer 1</label>
                        <select
                            className="w-full mt-1 p-2 border rounded-md"
                            value={vol1Id}
                            onChange={(e) => setVol1Id(e.target.value)}
                        >
                            <option value="">Select User</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.roll_number})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Volunteer 2</label>
                        <select
                            className="w-full mt-1 p-2 border rounded-md"
                            value={vol2Id}
                            onChange={(e) => setVol2Id(e.target.value)}
                        >
                            <option value="">Select User</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.roll_number})</option>
                            ))}
                        </select>
                    </div>
                </div>
                <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onSave(date, { department_id: deptId, volunteer_1_id: vol1Id, volunteer_2_id: vol2Id })}
                    disabled={isSaving}
                >
                    <Save className="w-4 h-4 mr-2" /> Save Assignment
                </Button>
            </CardContent>
        </Card>
    );
};

export default ManageRoster;
