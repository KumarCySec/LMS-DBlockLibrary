import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, Bell, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/common/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/common/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card key={notif.id} className={cn(
                            "transition-colors",
                            !notif.read ? "bg-indigo-50 border-indigo-100" : "bg-white"
                        )}>
                            <CardContent className="p-4 flex gap-3">
                                <div className={cn(
                                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                    !notif.read ? "bg-indigo-500" : "bg-gray-300"
                                )} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={cn("font-medium", !notif.read ? "text-indigo-900" : "text-gray-900")}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{notif.body}</p>

                                    {!notif.read && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                                        >
                                            <Check className="w-3 h-3 mr-1" /> Mark as read
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
