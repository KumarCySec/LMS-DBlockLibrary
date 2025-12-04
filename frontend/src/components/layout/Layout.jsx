import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

import RequestOpen from '../RequestOpen';
import ScrollToTop from '../ui/ScrollToTop';

const Layout = () => {
    const { user } = useAuth();
    const [lastNotifId, setLastNotifId] = React.useState(null);

    React.useEffect(() => {
        if (user) {
            // Request permission immediately
            if ('Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission();
            }

            // Initial fetch to set baseline
            const fetchInitial = async () => {
                try {
                    const res = await import('../../api/axios').then(m => m.default.get('/common/notifications'));
                    if (res.data && res.data.length > 0) {
                        setLastNotifId(res.data[0].id);
                    }
                } catch (e) { }
            };
            fetchInitial();

            // Polling interval
            const interval = setInterval(async () => {
                try {
                    const res = await import('../../api/axios').then(m => m.default.get('/common/notifications'));
                    const notifs = res.data;
                    if (notifs && notifs.length > 0) {
                        const latest = notifs[0];
                        setLastNotifId(prev => {
                            if (prev && latest.id > prev) {
                                // New notification found!
                                if (Notification.permission === 'granted') {
                                    new Notification(latest.title, {
                                        body: latest.body,
                                        icon: '/vite.svg' // Optional icon
                                    });
                                }
                            }
                            return latest.id;
                        });
                    }
                } catch (e) { console.error(e); }
            }, 10000); // Poll every 10 seconds

            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50 pb-32"> {/* Increased padding to prevent overlap */}
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg relative">
                <Outlet />
            </main>
            <ScrollToTop />
            <RequestOpen />
            {user && <BottomNav />}
        </div>
    );
};

export default Layout;
