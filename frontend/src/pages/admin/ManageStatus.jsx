import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Activity, Save } from 'lucide-react';

const ManageStatus = () => {
    const [status, setStatus] = useState({
        is_open: false,
        message: '',
        next_open: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await api.get('/common/status');
            // Ensure next_open is formatted for datetime-local input (YYYY-MM-DDThh:mm)
            let nextOpen = '';
            if (response.data.next_open) {
                nextOpen = new Date(response.data.next_open).toISOString().slice(0, 16);
            }

            setStatus({
                ...response.data,
                next_open: nextOpen
            });
        } catch (error) {
            console.error("Failed to fetch status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/common/status', {
                is_open: status.is_open,
                message: status.message,
                next_open: status.next_open
            });
            alert("Status updated successfully!");
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Activity className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Library Status</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="font-medium text-gray-700">Is Library Open?</label>
                        <button
                            onClick={() => setStatus(s => ({ ...s, is_open: !s.is_open }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${status.is_open ? 'bg-emerald-500' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status.is_open ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-bold ${status.is_open ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {status.is_open ? 'OPEN' : 'CLOSED'}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Message</label>
                        <Input
                            value={status.message || ''}
                            onChange={(e) => setStatus(s => ({ ...s, message: e.target.value }))}
                            placeholder="e.g. Open for issue/return"
                        />
                    </div>

                    {!status.is_open && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next Estimated Open Time</label>
                            <Input
                                type="datetime-local"
                                value={status.next_open || ''}
                                onChange={(e) => setStatus(s => ({ ...s, next_open: e.target.value }))}
                            />
                        </div>
                    )}

                    <Button
                        className="w-full mt-4"
                        onClick={handleSave}
                        isLoading={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Update Status
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageStatus;
