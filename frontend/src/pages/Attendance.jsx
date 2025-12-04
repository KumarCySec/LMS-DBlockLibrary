import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Clock, Calendar, CheckCircle, XCircle, History } from 'lucide-react';
import { format } from 'date-fns';

const Attendance = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState(null); // { is_scheduled, log }
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchStatus();
        fetchHistory();
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/attendance/status');
            setStatus(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/attendance/history');
            setHistory(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCheckIn = async () => {
        setActionLoading(true);
        try {
            await api.post('/attendance/check-in');
            fetchStatus();
            fetchHistory();
        } catch (e) {
            alert(e.response?.data?.error || "Check-in failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            await api.post('/attendance/check-out');
            fetchStatus();
            fetchHistory();
        } catch (e) {
            alert(e.response?.data?.error || "Check-out failed");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const isCheckedIn = status?.log?.status === 'ACTIVE';
    const isCompleted = status?.log?.status === 'COMPLETED';

    return (
        <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
            {/* Header / Clock */}
            <div className="text-center space-y-2 py-8">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    {format(currentTime, 'hh:mm:ss a')}
                </h1>
                <p className="text-gray-500 font-medium">
                    {format(currentTime, 'EEEE, MMMM do, yyyy')}
                </p>
            </div>

            {/* Main Action Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <CardContent className="p-8 text-center relative z-10">
                    {status?.is_scheduled ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {isCheckedIn ? "You are On Duty" : (isCompleted ? "Duty Completed" : "Scheduled for Duty")}
                                </h2>
                                <p className="text-indigo-100">
                                    {isCheckedIn ? `Checked in at ${format(new Date(status.log.check_in), 'hh:mm a')}` : "Please mark your attendance accurately."}
                                </p>
                            </div>

                            {!isCompleted && (
                                <Button
                                    size="lg"
                                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                                    isLoading={actionLoading}
                                    className={`w-full h-16 text-lg font-bold shadow-lg transition-transform active:scale-95 ${isCheckedIn
                                            ? "bg-rose-500 hover:bg-rose-600 text-white"
                                            : "bg-emerald-400 hover:bg-emerald-500 text-indigo-900"
                                        }`}
                                >
                                    {isCheckedIn ? "Check Out" : "Check In"}
                                </Button>
                            )}

                            {isCompleted && (
                                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                                    <p className="font-medium">Total Duration</p>
                                    <p className="text-2xl font-bold">{status.log.duration} mins</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-indigo-200" />
                            <h2 className="text-xl font-bold">No Duty Scheduled</h2>
                            <p className="text-indigo-100 mt-2">You are not assigned to the roster for today.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5" /> Recent Activity
                </h3>
                <div className="space-y-2">
                    {history.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No attendance history found.</p>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">{format(new Date(item.date), 'MMM dd, yyyy')}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(item.check_in), 'hh:mm a')} - {item.check_out ? format(new Date(item.check_out), 'hh:mm a') : 'Active'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                    {item.duration && <p className="text-xs text-gray-400 mt-1">{item.duration}m</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
