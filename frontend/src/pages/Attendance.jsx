import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Clock, Calendar, CheckCircle, XCircle, History, Lock, Unlock, MapPin, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
    const { user, hasPermission } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceStatus, setAttendanceStatus] = useState(null); // { is_scheduled, log }
    const [libraryStatus, setLibraryStatus] = useState(null); // { is_open, message }
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ open: false, type: null }); // type: 'in' | 'out'

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchAllData();
        return () => clearInterval(timer);
    }, []);

    const fetchAllData = async () => {
        try {
            const [attRes, libRes, histRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/common/status'),
                api.get('/attendance/history')
            ]);
            setAttendanceStatus(attRes.data);
            setLibraryStatus(libRes.data);
            setHistory(histRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenLibrary = async () => {
        setActionLoading(true);
        try {
            await api.post('/common/status', { is_open: true, message: "Library Opened for Duty" });
            fetchAllData();
        } catch (e) {
            alert("Failed to open library");
        } finally {
            setActionLoading(false);
        }
    };

    const proceedCheckIn = async () => {
        setActionLoading(true);
        try {
            await api.post('/attendance/check-in');
            fetchAllData();
            setConfirmModal({ open: false, type: null });
        } catch (e) {
            alert(e.response?.data?.error || "Check-in failed");
        } finally {
            setActionLoading(false);
        }
    };

    const proceedCheckOut = async () => {
        setActionLoading(true);
        try {
            await api.post('/attendance/check-out');
            fetchAllData();
            setConfirmModal({ open: false, type: null });
        } catch (e) {
            alert(e.response?.data?.error || "Check-out failed");
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to parse UTC string to Local Date object
    const parseUTCDate = (dateString) => {
        if (!dateString) return null;
        // If it doesn't end with Z, append it to treat as UTC
        const safeString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
        return new Date(safeString);
    };

    // Helper to format duration
    const formatDuration = (minutes) => {
        if (!minutes) return "0 mins";
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs} hr ${mins} mins`;
        return `${mins} mins`;
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const isCheckedIn = attendanceStatus?.log?.status === 'ACTIVE';
    const isCompleted = attendanceStatus?.log?.status === 'COMPLETED';
    const isScheduled = attendanceStatus?.is_scheduled;
    const isLibraryOpen = libraryStatus?.is_open;
    const canManageStatus = hasPermission('update_library_status');

    return (
        <div className="p-4 space-y-6 pb-24 max-w-md mx-auto">
            {/* Header / Clock */}
            <div className="text-center space-y-1 py-6">
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                    {format(currentTime, 'hh:mm')}
                    <span className="text-xl font-medium text-gray-500 ml-1">{format(currentTime, 'a')}</span>
                </h1>
                <p className="text-gray-500 font-medium uppercase tracking-wide text-xs">
                    {format(currentTime, 'EEEE, MMMM do')}
                </p>
            </div>

            {/* Main Action Card */}
            <div className="relative">
                {/* Status Indicator */}
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold shadow-sm z-10 flex items-center gap-2 ${isLibraryOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {isLibraryOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {isLibraryOpen ? 'LIBRARY OPEN' : 'LIBRARY CLOSED'}
                </div>

                <Card className={`border-0 shadow-2xl overflow-hidden relative ${isCheckedIn ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white' : 'bg-white text-gray-900'
                    }`}>
                    <CardContent className="p-8 pt-10 text-center relative z-0">
                        {!isScheduled ? (
                            <div className="py-6 space-y-4">
                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">No Duty Scheduled</h2>
                                    <p className="text-gray-500 text-sm mt-1">You are not on the roster for today.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-2xl font-bold mb-1 ${isCheckedIn ? 'text-white' : 'text-gray-900'}`}>
                                        {isCheckedIn ? "You are On Duty" : (isCompleted ? "Duty Completed" : "Ready for Duty?")}
                                    </h2>
                                    <p className={`text-sm ${isCheckedIn ? 'text-indigo-100' : 'text-gray-500'}`}>
                                        {isCheckedIn
                                            ? `Checked in since ${format(parseUTCDate(attendanceStatus.log.check_in), 'hh:mm a')}`
                                            : "Please ensure the library is open before checking in."}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    {!isLibraryOpen && !isCheckedIn && (
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-left">
                                            <div className="flex gap-3">
                                                <Lock className="w-5 h-5 text-orange-500 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-orange-800">Library is Closed</p>
                                                    <p className="text-xs text-orange-600 mt-1">You must open the library to mark attendance.</p>
                                                </div>
                                            </div>
                                            {canManageStatus && (
                                                <Button
                                                    onClick={handleOpenLibrary}
                                                    isLoading={actionLoading}
                                                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white border-0"
                                                >
                                                    Open Library Now
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {(isLibraryOpen || isCheckedIn) && !isCompleted && (
                                        <Button
                                            size="lg"
                                            onClick={() => setConfirmModal({ open: true, type: isCheckedIn ? 'out' : 'in' })}
                                            isLoading={actionLoading}
                                            className={`w-full h-14 text-lg font-bold shadow-lg transition-all active:scale-95 rounded-xl ${isCheckedIn
                                                ? "bg-white text-rose-600 hover:bg-rose-50"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                }`}
                                        >
                                            {isCheckedIn ? "Punch Out" : "Punch In"}
                                        </Button>
                                    )}
                                </div>

                                {isCompleted && (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div className="text-left">
                                            <p className="text-xs text-green-600 font-bold uppercase">Total Duration</p>
                                            <p className="text-xl font-bold text-green-800">{formatDuration(attendanceStatus.log.duration)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* History */}
            <div className="pt-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                    <History className="w-4 h-4" /> Recent Activity
                </h3>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">No attendance history found.</p>
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center transition-colors hover:border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{format(new Date(item.date), 'MMM dd, yyyy')}</p>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {format(parseUTCDate(item.check_in), 'hh:mm a')}
                                            {item.check_out && ` - ${format(parseUTCDate(item.check_out), 'hh:mm a')}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.duration ? (
                                        <span className="text-sm font-bold text-gray-900">{formatDuration(item.duration)}</span>
                                    ) : (
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-pulse">Active</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'in' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                {confirmModal.type === 'in' ? <Clock className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {confirmModal.type === 'in' ? 'Confirm Check-In' : 'Confirm Check-Out'}
                            </h3>
                            <p className="text-gray-500 text-sm mt-2">
                                {confirmModal.type === 'in'
                                    ? "Are you ready to start your duty? Make sure the library is open."
                                    : "Are you sure you want to end your duty? This will stop the timer."}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmModal({ open: false, type: null })}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmModal.type === 'in' ? proceedCheckIn : proceedCheckOut}
                                className={`w-full ${confirmModal.type === 'in' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                            >
                                {confirmModal.type === 'in' ? 'Yes, Punch In' : 'Yes, Punch Out'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
