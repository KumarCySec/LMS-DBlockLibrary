import React, { useState } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { AlertTriangle, Trash2, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomSheet from '../../components/ui/BottomSheet';

const SystemReset = () => {
    const [loading, setLoading] = useState(false);
    const [modalData, setModalData] = useState({ open: false, type: null, title: '', description: '' });
    const [secretKey, setSecretKey] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const openModal = (type, title, description) => {
        setModalData({ open: true, type, title, description });
        setSecretKey('');
        setSelectedDate('');
    };

    const handleAction = async () => {
        if (!secretKey) return alert("Secret Key is required");
        setLoading(true);

        try {
            let endpoint = '';
            let payload = { secret_key: secretKey };

            if (modalData.type === 'force_return') {
                endpoint = '/admin/system/reset-transactions';
                payload.type = 'all';
            } else if (modalData.type === 'clear_date') {
                if (!selectedDate) throw new Error("Date is required");
                endpoint = '/admin/system/reset-transactions';
                payload.type = 'date';
                payload.date = selectedDate;
            } else if (modalData.type === 'delete_users') {
                endpoint = '/admin/system/delete-users';
            } else if (modalData.type === 'history') {
                endpoint = '/admin/system/reset-transactions';
                payload.type = 'history';
            }

            const response = await api.post(endpoint, payload);
            alert(response.data.message || "Action successful");
            setModalData({ ...modalData, open: false });
        } catch (error) {
            console.error("System action failed", error);
            alert(error.response?.data?.error || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
                <Link to="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">System Reset & Cleanup</h1>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-amber-800">Danger Zone</h3>
                    <p className="text-sm text-amber-700 mt-1">
                        These actions are destructive and cannot be undone.
                        They require the master Admin Secret Key to execute.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Transaction Reset Card */}
                <Card className="border-red-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-indigo-600" />
                            Manage Transactions
                        </CardTitle>
                        <CardDescription>
                            Force return books or clear old transaction history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => openModal(
                                'force_return',
                                'Force Return All Books',
                                'This will mark ALL currently issued books as returned and restore their inventory count. Use this if physical inventory is out of sync.'
                            )}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Force Return All Books (Reset Inventory)
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start text-gray-700 hover:text-gray-900 border-gray-200"
                            onClick={() => openModal(
                                'clear_date',
                                'Clear Transactions by Date',
                                'This will DELETE transaction records created on a specific date. This cannot be undone.'
                            )}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Clear Transactions by Date
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => openModal(
                                'history',
                                'Delete ALL History',
                                'This will PERMANENTLY DELETE all transaction history records from the database. Active loans will be virtually returned to inventory before deletion.'
                            )}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ALL Transaction History
                        </Button>
                    </CardContent>
                </Card>

                {/* User Reset Card */}
                <Card className="border-red-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-rose-600" />
                            User Database
                        </CardTitle>
                        <CardDescription>
                            Actions related to user accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full justify-start bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={() => openModal(
                                'delete_users',
                                'Delete All Users',
                                'This will permanently delete ALL users except Admins. All student and volunteer data, including their transaction history, will be lost.'
                            )}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All Users (Except Admin)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <BottomSheet
                isOpen={modalData.open}
                onClose={() => setModalData({ ...modalData, open: false })}
                title={modalData.title}
                footer={
                    <Button
                        className="w-full bg-rose-600 hover:bg-rose-700"
                        onClick={handleAction}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Confirm & Execute'}
                    </Button>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">{modalData.description}</p>

                    {modalData.type === 'clear_date' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Select Date</label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-rose-600 uppercase mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            Admin Secret Key Required
                        </p>
                        <Input
                            type="password"
                            placeholder="Enter Secret Key"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            autoComplete="new-password"
                            className="border-rose-200 focus:ring-rose-500"
                        />
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

export default SystemReset;
