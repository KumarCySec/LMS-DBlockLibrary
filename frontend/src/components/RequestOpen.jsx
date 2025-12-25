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

    // Unified Modal State: { show, title, message, type: 'success'|'error'|'warning'|'info' }
    const [modalConfig, setModalConfig] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        checkStatus();
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
                setModalConfig({
                    show: true,
                    title: 'Request Sent (Fallback)',
                    message: res.data.message || 'No volunteers duty today. Notified Incharges.',
                    type: 'info'
                });
            } else {
                setModalConfig({
                    show: true,
                    title: 'Request Sent',
                    message: res.data.message || 'Volunteers have been notified!',
                    type: 'success'
                });
            }
        } catch (e) {
            if (e.response?.status === 429) {
                setModalConfig({
                    show: true,
                    title: 'Please Wait',
                    message: e.response.data.message || 'You are requesting too frequently.',
                    type: 'warning'
                });
            } else {
                setModalConfig({
                    show: true,
                    title: 'Request Failed',
                    message: e.response?.data?.message || 'Could not send request. Try again later.',
                    type: 'error'
                });
            }
        } finally {
            setLoading(false);
            // Auto hide after 4s
            setTimeout(() => setModalConfig(prev => ({ ...prev, show: false })), 4000);
        }
    };

    if (isOpen || !user) return null;

    return (
        <>
            {/* Mobile: Left-4 Bottom-24 | Desktop: Right-8 Bottom-8 */}
            <div className="fixed bottom-24 left-4 md:left-auto md:right-8 md:bottom-8 z-50">
                <Button
                    onClick={handleRequestOpen}
                    disabled={loading || requested}
                    className={`rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all ${requested ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600 animate-bounce'}`}
                >
                    {requested ? <Bell className="w-6 h-6 text-white" /> : <BellRing className="w-6 h-6 text-white" />}
                </Button>
                {!requested && (
                    <div className="absolute left-16 top-2 md:left-auto md:right-16 md:top-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Request to Open
                    </div>
                )}
            </div>

            {/* Unified Modal */}
            {modalConfig.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${modalConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                modalConfig.type === 'error' ? 'bg-red-100 text-red-600' :
                                    modalConfig.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        'bg-blue-100 text-blue-600'
                            }`}>
                            {modalConfig.type === 'success' ? <BellRing className="w-6 h-6" /> :
                                modalConfig.type === 'error' ? <Bell className="w-6 h-6" /> :
                                    <BellRing className="w-6 h-6" />}
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">{modalConfig.title}</h3>
                        <p className="text-gray-600 text-center mb-6">
                            {modalConfig.message}
                        </p>
                        <Button className={`w-full ${modalConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-indigo-600 hover:bg-indigo-700'
                            }`} onClick={() => setModalConfig(prev => ({ ...prev, show: false }))}>
                            Okay
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RequestOpen;
