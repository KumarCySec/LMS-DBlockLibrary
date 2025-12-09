import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Bell, BellRing } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

const RequestOpen = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [requested, setRequested] = useState(false);

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        checkStatus();
        // Request notification permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    const checkStatus = async () => {
        try {
            const [statusRes, rosterRes] = await Promise.all([
                api.get('/common/status'),
                api.get('/roster/today').catch(() => ({ data: null }))
            ]);
            setIsOpen(statusRes.data.is_open);

            // Check if current user is on duty
            if (rosterRes.data) {
                const userId = user.id;
                const v1 = rosterRes.data.volunteer1?.id;
                const v2 = rosterRes.data.volunteer2?.id;
                if (userId === v1 || userId === v2) {
                    setIsOpen(true);
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleRequestOpen = async () => {
        setLoading(true);
        try {
            const res = await api.post('/common/request-open');
            setRequested(true);

            if (res.data.fallback) {
                setShowModal(true);
                // Auto dismiss after 3s
                setTimeout(() => setShowModal(false), 4000);
            } else {
                alert("Request sent to today's volunteers!");
            }
        } catch (e) {
            alert("Failed to send request: " + (e.response?.data?.message || e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    if (isOpen || !user) return null;

    return (
        <>
            <div className="fixed bottom-24 left-4 z-50">
                <Button
                    onClick={handleRequestOpen}
                    disabled={loading || requested}
                    className={`rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all ${requested ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600 animate-bounce'}`}
                >
                    {requested ? <Bell className="w-6 h-6 text-white" /> : <BellRing className="w-6 h-6 text-white" />}
                </Button>
                {!requested && (
                    <div className="absolute left-16 top-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Request to Open
                    </div>
                )}
            </div>

            {/* Fallback Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto text-amber-600">
                            <BellRing className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Request Sent</h3>
                        <p className="text-gray-600 text-center mb-6">
                            No volunteers are assigned for today. Your request has been forwarded to the <span className="font-bold text-indigo-600">Incharges & Admins</span>.
                        </p>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowModal(false)}>
                            Okay, Thanks
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RequestOpen;
