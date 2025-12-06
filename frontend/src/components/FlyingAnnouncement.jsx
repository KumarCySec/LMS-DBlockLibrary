import React, { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';

const FlyingAnnouncement = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [visible, setVisible] = useState(false);

    const checkAnnouncement = async () => {
        try {
            const res = await api.get('/announcements/'); // Trailing slash to avoid 308 redirect and CORS error
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

    const handleDismiss = () => {
        setVisible(false);
        if (announcement) {
            localStorage.setItem('lastSeenAnnouncement', announcement.id);
        }
    };

    if (!visible || !announcement) return null;

    return (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-right-full duration-500">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                    <button
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-lg shrink-0 animate-bounce">
                            <Megaphone className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg leading-tight mb-1">{announcement.title}</h3>
                            <p className="text-indigo-100 text-sm line-clamp-3">{announcement.message}</p>
                            <div className="mt-2 text-xs text-indigo-200 flex justify-between items-center">
                                <span>{new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
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
