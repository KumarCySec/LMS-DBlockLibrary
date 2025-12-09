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
    const [showDevCard, setShowDevCard] = useState(false);
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
        <div className="h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto flex flex-col gap-4 overflow-hidden">
            {/* Top Section: Identity & Personal Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
                {/* Identity Card */}
                <div className="lg:col-span-2 relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-2xl p-6 text-white overflow-hidden shadow-lg flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <BookOpen className="w-48 h-48 -mr-10 -mt-10" />
                    </div>

                    <div className="relative z-10 flex flex-row items-center gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl font-bold border-4 border-white/30 shadow-2xl">
                            {user.name[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold truncate">{user.name}</h1>
                            <p className="text-indigo-100 text-lg font-medium">{user.roll_number}</p>

                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/10 flex items-center">
                                    {user.department || 'Unknown'}
                                </span>
                                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/10 flex items-center">
                                    Batch {user.batch || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Details & Actions */}
                <Card className="lg:col-span-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm flex flex-col justify-center">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-base font-bold text-gray-900 flex items-center">
                                <User className="w-4 h-4 mr-2 text-indigo-600" />
                                Personal Details
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="h-6 w-6 p-0 hover:bg-indigo-50 text-indigo-600"
                            >
                                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-3 h-3" />}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center text-sm group">
                                <div className="p-2 bg-indigo-50 rounded-lg mr-3 group-hover:bg-indigo-100 transition-colors">
                                    <Mail className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Email</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full border-b border-indigo-300 focus:border-indigo-600 outline-none bg-transparent py-0.5 text-gray-900"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium truncate">{user.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center text-sm group">
                                <div className="p-2 bg-green-50 rounded-lg mr-3 group-hover:bg-green-100 transition-colors">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Phone</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full border-b border-green-300 focus:border-green-600 outline-none bg-transparent py-0.5 text-gray-900"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium truncate">{user.phone_number || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <Button className="w-full h-8 text-xs" onClick={handleSave} isLoading={loading}>
                                Save Changes
                            </Button>
                        )}

                        <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1 h-8 text-xs border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={logout}>
                                <LogOut className="w-3 h-3 mr-1.5" /> Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
                <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-all border-blue-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-medium text-blue-600 mb-1">Loans</span>
                        <span className="text-2xl font-black text-gray-800">{stats.current_borrowings}</span>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-all border-emerald-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-medium text-emerald-600 mb-1">Read</span>
                        <span className="text-2xl font-black text-gray-800">{stats.books_read}</span>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-all border-purple-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-medium text-purple-600 mb-1">Days</span>
                        <span className="text-2xl font-black text-gray-800">{stats.total_days_reading}</span>
                    </CardContent>
                </Card>
            </div>

            {/* History Section (Scrollable Area) */}
            <Card className="flex-1 overflow-hidden border-indigo-50 shadow-md flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                        Recent History
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">Last 5 activities</span>
                </div>
                <div className="overflow-y-auto p-2 space-y-2 h-full custom-scrollbar">
                    {history.length > 0 ? (
                        history.map((item) => (
                            <div key={item.id} className="group flex items-center p-3 hover:bg-indigo-50/50 rounded-xl transition-all border border-transparent hover:border-indigo-100 cursor-default">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h4>
                                    <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                                        <span className="bg-gray-100 px-1.5 rounded text-[10px] font-medium text-gray-600">{formatDate(item.issue_date)}</span>
                                        <span className="text-gray-300">→</span>
                                        <span className="bg-gray-100 px-1.5 rounded text-[10px] font-medium text-gray-600">{formatDate(item.return_date) || 'Pending'}</span>
                                    </div>
                                </div>
                                {item.fine > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                            ₹{item.fine}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm">No reading history yet</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Developer Trigger */}
            <div className="text-center py-2 shrink-0">
                <button
                    onClick={() => setShowDevCard(true)}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center mx-auto"
                >
                    <span className="bg-indigo-50 px-3 py-1 rounded-full">More about developer ✨</span>
                </button>
            </div>

            {/* Developer Card Modal */}
            {showDevCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setShowDevCard(false)}>
                    <div
                        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Premium Background Header */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500">
                            {/* Decorative circles */}
                            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-indigo-900/20 rounded-full blur-xl"></div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowDevCard(false)}
                            className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative flex flex-col items-center pt-16 pb-8 px-6">
                            {/* Profile Image with Glow */}
                            <div className="relative mb-4 group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                                    {/* Placeholder - User should replace '/developer.png' in public folder */}
                                    <img
                                        src="/developer.png"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://ui-avatars.com/api/?name=Kishore+Kumar&background=6366f1&color=fff&size=256";
                                        }}
                                        alt="Kishore Kumar S"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white shadow-sm" title="Online"></div>
                            </div>

                            {/* Name & Title */}
                            <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Kishore Kumar S</h2>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold text-sm mb-4">
                                Full Stack Developer
                            </p>

                            {/* Details Chips */}
                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
                                    Batch 2027
                                </span>
                                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
                                    ECE Dept
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>

                            {/* Quote/Bio */}
                            <p className="text-center text-gray-500 text-sm italic leading-relaxed mb-6">
                                "Crafting digital experiences with code and creativity. Building the future, one line at a time."
                            </p>

                            {/* Contact/Social placeholders */}
                            <div className="flex gap-4">
                                <Button size="sm" className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6">
                                    Connect
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Profile;
