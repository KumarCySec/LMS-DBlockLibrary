import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const Settings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.post('/admin/settings', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    // Define known settings with labels
    const configFields = [
        { key: 'fine_per_day', label: 'Fine Per Day (₹)', type: 'number' },
        { key: 'default_due_days', label: 'Default Due Days (Books)', type: 'number' },
        { key: 'laptop_due_days', label: 'Laptop Loan Period (Days)', type: 'number' },
        { key: 'laptop_daily_rent', label: 'Laptop Daily Rent (₹)', type: 'number' },
        { key: 'max_renewals', label: 'Max Renewals Allowed', type: 'number' },
        { key: 'prevent_same_day_return', label: 'Prevent Same Day Return/Renew', type: 'boolean' },
        { key: 'library_open_time', label: 'Library Open Time', type: 'time' },
        { key: 'library_close_time', label: 'Library Close Time', type: 'time' },
    ];

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {configFields.map((field) => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>
                            {field.type === 'boolean' ? (
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings[field.key] || 'false'}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                >
                                    <option value="false">Off (Allowed)</option>
                                    <option value="true">On (Restricted)</option>
                                </select>
                            ) : (
                                <Input
                                    type={field.type}
                                    value={settings[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={`Enter ${field.label}`}
                                />
                            )}
                        </div>
                    ))}

                    {/* Dynamic fields for any other settings found in DB but not in configFields */}
                    {Object.keys(settings).filter(k => !configFields.find(f => f.key === k)).map(key => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                {key.replace(/_/g, ' ')}
                            </label>
                            <Input
                                type="text"
                                value={settings[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                        </div>
                    ))}

                    {message && (
                        <div className={cn(
                            "p-3 rounded text-sm font-medium",
                            message.type === 'success' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                            {message.text}
                        </div>
                    )}

                    <Button
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleSave}
                        isLoading={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
