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
                    setIsOpen(true); // Hide button by pretending it's open (or just return null)
                    // Better: set a flag
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleRequestOpen = async () => {
        setLoading(true);
        try {
            await api.post('/common/request-open');
            setRequested(true);
            alert("Request sent to today's volunteers!");
        } catch (e) {
            alert("Failed to send request: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    if (isOpen || !user) return null;

    return (
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
    );
};

export default RequestOpen;
