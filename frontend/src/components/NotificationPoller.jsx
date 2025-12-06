import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission, showBrowserNotification } from '../utils/notificationService';

const NotificationPoller = ({ onUpdate }) => {
    const { user } = useAuth();
    const [lastNotifId, setLastNotifId] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Request permission
        requestNotificationPermission();

        // Initial fetch
        const fetchInitial = async () => {
            try {
                const res = await api.get('/common/notifications');
                if (res.data && res.data.length > 0) {
                    setLastNotifId(res.data[0].id);
                    // Count unread
                    const unread = res.data.filter(n => !n.is_read).length;
                    if (onUpdate) onUpdate(unread);
                } else {
                    if (onUpdate) onUpdate(0);
                }
            } catch (e) { }
        };
        fetchInitial();

        // Polling
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/common/notifications');
                const notifs = res.data;
                if (notifs) {
                    // Update count
                    const unread = notifs.filter(n => !n.is_read).length;
                    if (onUpdate) onUpdate(unread);

                    if (notifs.length > 0) {
                        const latest = notifs[0];
                        setLastNotifId(prev => {
                            if (prev && latest.id > prev) {
                                // New notification found!
                                showBrowserNotification(latest.title, latest.body, `notif-${latest.id}`);
                            }
                            return latest.id;
                        });
                    }
                }
            } catch (e) { console.error(e); }
        }, 10000); // 10s

        return () => clearInterval(interval);
    }, [user]);

    return null; // Invisible component
};

export default NotificationPoller;
