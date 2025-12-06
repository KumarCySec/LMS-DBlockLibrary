import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { User, LogOut, Shield, BookOpen, Clock, Calendar, Edit2, Save, X, Phone, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api/axios';
import { formatDate } from '../utils/dateUtils';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center space-x-4">
            <div className={cn("p-3 rounded-full", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const Profile = () => {
    const { user, logout, checkAuth } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone_number: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone_number: user.phone_number || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/auth/me', formData);
            await checkAuth(); // Refresh user data
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    // Safe role handling
    const roles = user.roles ? user.roles : (user.role ? [user.role] : []);
    const stats = user.stats || { current_borrowings: 0, books_read: 0, total_days_reading: 0 };
    const history = user.history || [];

    return (
        <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BookOpen className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-lg">
                        {user.name[0]}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-indigo-100 text-lg mb-2">{user.roll_number}</p>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {roles.map((role, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium flex items-center border border-white/10">
                                    <Shield className="w-3 h-3 mr-1.5" /> {role.name || role}
                                </span>
                            ))}
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">
                                {user.department || 'Unknown Dept'}
                            </span>
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10">
                                Batch {user.batch || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    >
                        {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={BookOpen}
                    label="Current Loans"
                    value={stats.current_borrowings}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Calendar}
                    label="Books Read"
                    value={stats.books_read}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={Clock}
                    label="Reading Days"
                    value={stats.total_days_reading}
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Info Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-indigo-600" />
                                Personal Details
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="flex-1 text-sm border-b border-gray-300 focus:border-indigo-500 outline-none py-1"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 font-medium flex items-center">
                                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                            {user.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                            <input
                                                type="tel"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                className="flex-1 text-sm border-b border-gray-300 focus:border-indigo-500 outline-none py-1"
                                                placeholder="+91..."
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 font-medium flex items-center">
                                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                            {user.phone_number || 'Not set'}
                                        </p>
                                    )}
                                </div>

                                {isEditing && (
                                    <Button
                                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={handleSave}
                                        isLoading={loading}
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="danger" className="w-full shadow-sm" onClick={logout}>
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full shadow-sm mt-2"
                        onClick={() => {
                            if ('Notification' in window) {
                                Notification.requestPermission().then(perm => {
                                    if (perm === 'granted') alert("Notifications enabled!");
                                    else alert("Notifications denied. Please enable them in browser settings.");
                                });
                            } else {
                                alert("This browser does not support notifications.");
                            }
                        }}
                    >
                        <Shield className="w-4 h-4 mr-2" /> Enable Notifications
                    </Button>
                </div>

                {/* Reading History Column */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                                Recent Reading History
                            </h3>

                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((item) => (
                                        <div key={item.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                            <div className="p-2 bg-indigo-50 rounded-md mr-4">
                                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{item.title}</h4>
                                                <p className="text-sm text-gray-500">{item.author}</p>
                                                <div className="mt-1 flex items-center text-xs text-gray-400 space-x-3">
                                                    <span>Issued: {formatDate(item.issue_date)}</span>
                                                    <span>•</span>
                                                    <span>Returned: {formatDate(item.return_date)}</span>
                                                </div>
                                            </div>
                                            {item.fine > 0 && (
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                                    Fine: ₹{item.fine}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p>No reading history yet.</p>
                                    <p className="text-sm">Start borrowing books to build your history!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;
