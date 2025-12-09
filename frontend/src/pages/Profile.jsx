import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { User, Mail, Phone, Book, Calendar, Shield, CreditCard, History, Clock, LogOut, Linkedin, X, Edit2, Loader2, Save } from 'lucide-react';
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

    return (
        <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">

            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                <div className="px-6 pb-6 pt-0 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-4 gap-4">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500 font-medium">{user.roll_number}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="rounded-full">
                                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={logout} className="rounded-full">
                                <LogOut className="w-4 h-4 mr-2" /> Logout
                            </Button>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl animate-in fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg mt-1"
                                    value={formData.phone_number}
                                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded-lg mt-1"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleSave} isLoading={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><Shield className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Role</p>
                                    <p className="font-medium text-gray-900">{user.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><Book className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Department</p>
                                    <p className="font-medium text-gray-900">{user.department || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><Phone className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                                    <p className="font-medium text-gray-900">{user.phone_number || 'Not Set'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm"><Calendar className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Batch</p>
                                    <p className="font-medium text-gray-900">{user.batch || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                        <CardContent className="p-6">
                            <p className="text-indigo-100 font-medium mb-1">Books Read</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-bold">{stats.books_read}</h3>
                                <span className="text-sm text-indigo-200 mb-1">total</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md">
                        <CardContent className="p-6">
                            <p className="text-gray-500 font-medium mb-1">Active Checkouts</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-bold text-gray-900">{stats.current_borrowings}</h3>
                                <span className="text-sm text-gray-400 mb-1">items with you</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-md">
                        <CardContent className="p-6">
                            <p className="text-gray-500 font-medium mb-1">Reading Journey</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-bold text-gray-900">{stats.total_days_reading}</h3>
                                <span className="text-sm text-gray-400 mb-1">days active</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Transaction History */}
            <Card className="shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" /> Recent History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {history.map((tx) => (
                                <div key={tx.id} className="py-4 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-lg px-2">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{tx.title}</h4>
                                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                            <span>Issued: {tx.issue_date?.split('T')[0]}</span>
                                            <span>Returned: {tx.return_date?.split('T')[0]}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {tx.fine > 0 ? (
                                            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">Paid Fine: ₹{tx.fine}</span>
                                        ) : (
                                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">On Time</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Book className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No reading history yet. Borrow a book to get started!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer / Developer */}
            <div className="pt-8 pb-4 text-center">
                <button
                    onClick={() => setShowDevCard(true)}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center mx-auto"
                >
                    <span className="bg-indigo-50 px-3 py-1 rounded-full">About Developer</span>
                </button>
            </div>

            {/* Developer Modal */}
            {showDevCard && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white text-gray-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowDevCard(false)}
                            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-gray-800 p-2 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1">
                            <div className="bg-white rounded-[1.9rem] overflow-hidden relative">
                                {/* Header / Cover */}
                                <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] hover:opacity-50 transition-opacity"></div>
                                </div>

                                {/* Avatar & Content */}
                                <div className="px-6 pb-8 -mt-16 text-center relative">
                                    <div className="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-br from-indigo-500 to-pink-500 shadow-xl mb-4 relative z-10">
                                        <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                                            <img
                                                src="/developer.png"
                                                alt="Kishore Kumar S"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = '<span class="text-4xl font-bold text-gray-300">KS</span>';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Name & Title */}
                                    <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Kishore Kumar S</h2>
                                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold text-sm mb-4">
                                        Software Craftsman with AI
                                    </p>

                                    {/* Details Chips */}
                                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">Batch 2027</span>
                                        <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-100">ECE Dept</span>
                                        <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-100">OffSec</span>
                                    </div>

                                    {/* Quote/Bio */}
                                    <p className="text-center text-gray-500 text-sm italic leading-relaxed mb-6">
                                        Crafts systems with patience, precision, and a little bit of madness.
                                        Not a magician — just really good at debugging life.
                                    </p>

                                    {/* Contact/Social placeholders */}
                                    <div className="flex justify-center gap-4">
                                        <a
                                            href="https://www.linkedin.com/in/kishorekumaroffsec"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                size="sm"
                                                className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-6"
                                            >
                                                Connect <Linkedin className="w-4 h-4 ml-2" />
                                            </Button>
                                        </a>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
