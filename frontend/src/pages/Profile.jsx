import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { User, Mail, Phone, Book, Calendar, Shield, CreditCard, History, Clock, LogOut, Linkedin, X, Edit2, Loader2, Save, Sparkles, Zap, Award, QrCode, Github, ExternalLink, Code } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const Profile = () => {
    const { user, logout, checkAuth } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDevCard, setShowDevCard] = useState(false);

    const [profileData, setProfileData] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);

    const [formData, setFormData] = useState({
        phone_number: '',
        email: ''
    });

    useEffect(() => {
        const loadData = async () => {
            await checkAuth(); // Refresh basic user data
            fetchProfileDetails();
        };
        loadData();
    }, []);

    const fetchProfileDetails = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfileData(res.data);
            setStats(res.data.stats);
            setHistory(res.data.history || []);
            setFormData({
                phone_number: res.data.phone_number || '',
                email: res.data.email || ''
            });
        } catch (error) {
            console.error("Failed to load profile details", error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/auth/me', formData);
            await checkAuth(); // Refresh context
            await fetchProfileDetails(); // Refresh local data
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    // --- Components ---

    const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group">
            <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
                <Icon className="w-12 h-12" />
            </div>
            <div className="relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-black text-gray-900">{value}</h3>
                    <span className="text-[10px] text-gray-400 font-medium mb-1">{subtext}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Top Decorative Background - Smaller Height */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 -z-10 rounded-b-[2rem] shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            </div>

            <div className="p-3 max-w-5xl mx-auto space-y-4 pt-4">

                {/* 1. Digital ID Card (Main Profile) - Compact */}
                <div className="relative mt-4">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/50 relative overflow-hidden group">

                        {/* Edit & Logout Top Right */}
                        <div className="absolute top-3 right-3 flex gap-2 z-20">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="h-8 w-8 p-0 rounded-full bg-white/50 hover:bg-white text-gray-700 backdrop-blur-sm"
                            >
                                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="h-8 w-8 p-0 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 backdrop-blur-sm"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                            {/* Avatar Section */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                    ACTIVE
                                </div>
                            </div>

                            {/* User Info Section */}
                            <div className="flex-1 text-center md:text-left space-y-3 w-full">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">{user.name}</h1>
                                    <p className="text-sm md:text-base text-gray-500 font-medium">{user.roll_number}</p>
                                </div>

                                {isEditing ? (
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 animate-in fade-in space-y-3">
                                        <div className="text-left">
                                            <input
                                                type="text"
                                                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={formData.phone_number}
                                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                                placeholder="Phone (+91...)"
                                            />
                                        </div>
                                        <div className="text-left">
                                            <input
                                                type="email"
                                                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Email"
                                            />
                                        </div>
                                        <Button onClick={handleSave} isLoading={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm">
                                            <Save className="w-4 h-4 mr-2" /> Save
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
                                            <Shield className="w-3 h-3" /> {user.role}
                                        </span>
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100 flex items-center gap-1.5">
                                            <Book className="w-3 h-3" /> {user.department || 'No Dept'}
                                        </span>
                                        <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-bold border border-pink-100 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Batch {user.batch || 'N/A'}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-100 flex items-center gap-1.5">
                                            <Phone className="w-3 h-3" /> {user.phone_number || 'Add Phone'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Stats Grid - Side-by-side on mobile */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <StatCard
                            icon={Book}
                            label="Books Mastered"
                            value={stats.books_read}
                            subtext="completed"
                            colorClass="text-emerald-600"
                        />
                        <StatCard
                            icon={Clock}
                            label="Current Loans"
                            value={stats.current_borrowings}
                            subtext="active items"
                            colorClass="text-amber-600"
                        />
                        <StatCard
                            icon={Sparkles}
                            label="Knowledge Streak"
                            value={stats.total_days_reading}
                            subtext="days active"
                            colorClass="text-purple-600"
                        />
                    </div>
                )}

                {/* 3. Transaction History - Horizontal Scroll on Mobile, Grid on Desktop */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-600" /> Recent Activity
                        </h2>
                        {history.length > 0 && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{history.length} Records</span>}
                    </div>

                    {history.length > 0 ? (
                        <div className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible">
                            {history.map((tx) => (
                                <div key={tx.id} className="min-w-[280px] md:min-w-0 flex-shrink-0 snap-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
                                    {/* Decorative gradient blob */}
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform" />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                                {tx.title.charAt(0)}
                                            </div>
                                            {tx.fine > 0 ? (
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 flex items-center gap-1 shadow-sm">
                                                    <CreditCard className="w-3 h-3" /> -₹{tx.fine}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm">
                                                    <Award className="w-3 h-3" /> On Time
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1" title={tx.title}>{tx.title}</h4>
                                        <p className="text-xs text-gray-500 font-medium bg-gray-50 self-start inline-block px-2 py-0.5 rounded-md mb-3 line-clamp-1">{tx.author}</p>

                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-50 pt-2 mt-auto">
                                            <Calendar className="w-3 h-3" />
                                            Returned: <span className="font-medium text-gray-600">{tx.return_date?.split('T')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <History className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-sm">No recent history.</p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="pt-4 pb-2 flex justify-center">
                    <button
                        onClick={() => setShowDevCard(true)}
                        className="group flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm hover:shadow-md border border-gray-100 transition-all hover:-translate-y-0.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-600 group-hover:text-indigo-600 uppercase tracking-wider">
                            Designed by Developer
                        </span>
                    </button>
                </div>

            </div>

            {/* --- PREMIUM DEVELOPER CARD MODAL (LIGHT THEME) --- */}
            {showDevCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with blur */}
                    <div
                        className="absolute inset-0 bg-gray-600/30 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowDevCard(false)}
                    />

                    {/* The Card */}
                    <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 border border-white/20 ring-1 ring-white/30">

                        {/* 1. Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 z-0" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                        {/* 3. Content */}
                        <div className="relative z-10 p-8 flex flex-col items-center text-center">

                            {/* Close Button */}
                            <button
                                onClick={() => setShowDevCard(false)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Avatar with Special Effects */}
                            <div className="mb-6 relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-75 blur group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />
                                <div className="relative w-32 h-32 rounded-full p-[2px] bg-gradient-to-r from-white to-gray-100">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-gray-50 shadow-inner block relative">
                                        <img
                                            src="/developer.png"
                                            alt="Kishore Kumar S"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-50 text-indigo-400 font-black text-4xl">KS</div>';
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Verified Badge */}
                                <div className="absolute bottom-1 right-2 bg-blue-500 text-white p-1 rounded-full border-[3px] border-white shadow-sm" title="Verified Developer">
                                    <Sparkles className="w-3 h-3 fill-current" />
                                </div>
                            </div>

                            {/* Name & Title */}
                            <h2 className="text-3xl font-black text-gray-800 mb-1 drop-shadow-sm tracking-tight">
                                Kishore Kumar S
                            </h2>
                            <p className="text-indigo-600 font-bold text-xs tracking-widest uppercase mb-5 flex items-center gap-2 bg-indigo-50/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-indigo-100/50 shadow-sm">
                                <Code className="w-3 h-3" /> Software Craftsman with AI
                            </p>

                            {/* Skills / Tags */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <span className="px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-[10px] font-bold text-gray-600 shadow-sm hover:-translate-y-0.5 transition-transform cursor-default">ECE</span>
                                <span className="px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-[10px] font-bold text-gray-600 shadow-sm hover:-translate-y-0.5 transition-transform cursor-default">Batch 2027</span>
                            </div>

                            {/* Bio */}
                            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/50 shadow-lg relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                                <p className="text-gray-700 text-xs leading-relaxed font-medium">
                                    "Crafting digital experiences with a blend of creativity and code.
                                    Obsessed with clean architecture and making things look <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-black">Super Duper</span>."
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex w-full gap-3">
                                <a
                                    href="https://www.linkedin.com/in/kishorekumaroffsec"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button className="w-full bg-[#0077b5] hover:bg-[#006097] text-white border-none shadow-lg shadow-blue-500/20 py-6 rounded-2xl group transition-all text-sm font-bold active:scale-95">
                                        <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
                                    </Button>
                                </a>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-white/60 bg-white/60 hover:bg-white text-gray-800 py-6 rounded-2xl transition-all text-sm font-bold shadow-sm hover:shadow-md backdrop-blur-sm active:scale-95"
                                    onClick={() => window.location.href = 'mailto:kishore@example.com'}
                                >
                                    <Mail className="w-5 h-5 mr-2" /> Email
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
