import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, Bell, Check, Inbox, Archive, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../components/ui/Button';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'history'
    const [expanded, setExpanded] = useState({}); // id -> boolean
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/common/notifications', {
                params: { include_past: activeTab === 'history' }
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
            fetchNotifications(); // Refresh to update ui state
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    const archiveRead = async () => {
        try {
            await api.post('/common/notifications/archive-read');
            fetchNotifications(); // Refresh to remove archived items from inbox
        } catch (error) {
            console.error("Failed to archive read", error);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-600" />
                        Notifications
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Stay updated with your library activities
                    </p>
                </div>

                {activeTab === 'inbox' && notifications.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                            <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All Read
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={archiveRead}
                            className="text-xs font-bold text-gray-600 hover:text-gray-800"
                        >
                            <Archive className="w-4 h-4 mr-1.5" /> Archive Read
                        </Button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-gray-100/50 p-1 rounded-xl flex gap-1">
                <button
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'inbox'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
                    )}
                    onClick={() => setActiveTab('inbox')}
                >
                    <Inbox className="w-4 h-4" /> Inbox
                </button>
                <button
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === 'history'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
                    )}
                    onClick={() => setActiveTab('history')}
                >
                    <Archive className="w-4 h-4" /> History
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                        {activeTab === 'inbox' ? <Inbox className="w-8 h-8 text-gray-300" /> : <Archive className="w-8 h-8 text-gray-300" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {activeTab === 'inbox' ? 'All caught up!' : 'No history yet'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {activeTab === 'inbox' ? 'Check back later for new updates.' : 'Archived notifications will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <Card key={notif.id} className={cn(
                            "transition-all duration-200 border-0 shadow-sm ring-1 ring-inset",
                            !notif.read
                                ? "bg-white ring-indigo-100 shadow-indigo-100/50"
                                : "bg-gray-50/50 ring-gray-100 text-gray-500"
                        )}>
                            <CardContent className="p-4 flex gap-4 cursor-pointer" onClick={() => {
                                // Default Navigation Logic
                                if (['checkout_request', 'renew_request', 'return_request'].includes(notif.type)) {
                                    let status = 'REQUESTED';
                                    if (notif.type === 'renew_request') status = 'RENEW_REQUESTED';
                                    if (notif.type === 'return_request') status = 'RETURN_REQUESTED';
                                    navigate(`/admin/transactions?status=${status}`);
                                } else if (['checkout_approved', 'checkout_rejected', 'item_returned', 'renewal_approved', 'overdue_alert', 'waitlist_available'].includes(notif.type)) {
                                    if (notif.related_item_id && notif.type === 'waitlist_available') {
                                        navigate(`/catalog/${notif.related_item_id}`);
                                    } else {
                                        navigate('/my-borrowings');
                                    }
                                } else if (notif.type === 'request_open') {
                                    navigate('/admin/status');
                                } else if (notif.type === 'announcement') {
                                    setExpanded(prev => ({ ...prev, [notif.id]: !prev[notif.id] }));
                                }

                                if (!notif.read) markAsRead(notif.id);
                            }}>
                                {/* Icon Indicator */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                    !notif.read ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"
                                )}>
                                    <Bell className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={cn("text-sm font-bold truncate pr-2", !notif.read ? "text-gray-900" : "text-gray-600")}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-white px-2 py-1 rounded-full border border-gray-100">
                                            {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <p className={cn("text-sm mt-1 leading-relaxed", !notif.read ? "text-gray-600" : "text-gray-400", expanded[notif.id] ? "" : "line-clamp-2")}>
                                        {notif.body}
                                    </p>

                                    {notif.type === 'announcement' && (
                                        <button className="text-xs text-indigo-500 mt-2 font-bold hover:underline">
                                            {expanded[notif.id] ? "Show less" : "Read more"}
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 justify-center border-l pl-3 border-gray-100">
                                    {!notif.read && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                            className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                                        className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                                        title={activeTab === 'inbox' ? "Archive" : "Delete"}
                                    >
                                        {activeTab === 'inbox' ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
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
