import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, Bell, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'past'
    const [expanded, setExpanded] = useState({}); // id -> boolean
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/common/notifications', {
                params: { include_past: activeTab === 'past' }
            });
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

    const dismiss = async (id) => {
        try {
            await api.post(`/common/notifications/${id}/clear`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to dismiss notification", error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/common/notifications/mark-all-read');
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications? They will be moved to Past Notifications.")) return;
        try {
            await api.post('/common/notifications/clear');
            fetchNotifications();
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    if (loading && notifications.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Notifications
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h1>
                </div>
                {activeTab === 'new' && notifications.length > 0 && (
                    <div className="flex gap-3">
                        <button onClick={markAllRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
                            Mark Read
                        </button>
                        <button onClick={clearAll} className="text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={cn(
                        "flex-1 pb-2 text-sm font-medium transition-colors relative",
                        activeTab === 'new' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setActiveTab('new')}
                >
                    New
                    {activeTab === 'new' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button
                    className={cn(
                        "flex-1 pb-2 text-sm font-medium transition-colors relative",
                        activeTab === 'past' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                    )}
                    onClick={() => setActiveTab('past')}
                >
                    Past Notifications
                    {activeTab === 'past' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No {activeTab} notifications.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card key={notif.id} className={cn(
                            "transition-colors",
                            !notif.read ? "bg-indigo-50 border-indigo-100" : "bg-white"
                        )}>
                            <CardContent className="p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => {
                                // Determine path based on type
                                if (notif.type === 'announcement') {
                                    setExpanded(prev => ({ ...prev, [notif.id]: !prev[notif.id] }));
                                } else if (['checkout_request', 'renew_request', 'return_request'].includes(notif.type)) {
                                    // For admins/staff
                                    let status = 'REQUESTED';
                                    if (notif.type === 'renew_request') status = 'RENEW_REQUESTED';
                                    if (notif.type === 'return_request') status = 'RETURN_REQUESTED';
                                    navigate(`/admin/transactions?status=${status}`);
                                } else if (['checkout_approved', 'checkout_rejected', 'item_returned', 'renewal_approved', 'overdue_alert'].includes(notif.type)) {
                                    // For students
                                    navigate('/my-borrowings');
                                } else if (notif.type === 'waitlist_available' && notif.related_item_id) {
                                    navigate(`/catalog/${notif.related_item_id}`);
                                } else if (notif.type === 'request_open') {
                                    navigate('/admin/status');
                                }

                                // Mark as read when clicked
                                if (!notif.read) markAsRead(notif.id);
                            }}>
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
                                    <p className={cn("text-sm text-gray-600 mt-1", expanded[notif.id] ? "" : "line-clamp-2")}>
                                        {notif.body}
                                    </p>
                                    {notif.type === 'announcement' && (
                                        <p className="text-xs text-indigo-500 mt-1 font-medium">
                                            {expanded[notif.id] ? "Show less" : "Click to expand"}
                                        </p>
                                    )}

                                    <div className="flex gap-3 mt-2">
                                        {!notif.read && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                                            >
                                                <Check className="w-3 h-3 mr-1" /> Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                                            className="text-xs font-medium text-gray-400 hover:text-rose-600 flex items-center transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
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
