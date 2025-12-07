import React, { useState, useEffect } from 'react';
import { X, Megaphone, Clock } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';

const FlyingAnnouncement = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [visible, setVisible] = useState(false);

    const checkAnnouncement = async () => {
        try {
            const res = await api.get('/announcements'); // Fixed CORS redirect
            if (res.data && res.data.length > 0) {
                const latest = res.data[0];
                const lastSeen = localStorage.getItem('lastSeenAnnouncement');

                if (!lastSeen || latest.id > parseInt(lastSeen)) {
                    setAnnouncement(latest);
                    setVisible(true);
                }
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        checkAnnouncement();
        const interval = setInterval(checkAnnouncement, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (visible) {
            if (announcement) {
                localStorage.setItem('lastSeenAnnouncement', announcement.id);
            }
            const timer = setTimeout(() => {
                setVisible(false);
            }, 10000); // Auto dismiss after 10 seconds
            return () => clearTimeout(timer);
        }
    }, [visible, announcement]);

    const handleDismiss = () => {
        setVisible(false);
    };

    if (!visible || !announcement) return null;

    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md px-4 animate-in zoom-in-95 duration-300 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-2xl border border-indigo-100 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden ring-4 ring-indigo-50/50 pointer-events-auto">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="p-6">
                    <div className="flex items-start gap-5">
                        <div className="p-3.5 bg-indigo-50 rounded-2xl shrink-0 border border-indigo-100/50 shadow-inner">
                            <Megaphone className="w-7 h-7 text-indigo-600 animate-[pulse_3s_ease-in-out_infinite]" />
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start -mr-2">
                                <h3 className="text-gray-900 font-bold text-lg leading-tight mb-2 tracking-tight">{announcement.title}</h3>
                                <button
                                    onClick={handleDismiss}
                                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-600 text-base leading-relaxed mb-4 font-medium">
                                {announcement.message}
                            </p>

                            <div className="flex items-center gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                                    {announcement.target_type === 'all' ? 'Everyone' : announcement.target_type}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlyingAnnouncement;
