import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Check, X, ArrowRight, RotateCcw, Clock, ShieldCheck, Banknote, History, Wallet, ChevronDown, ChevronUp, Filter, Search, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import BottomSheet from '../components/ui/BottomSheet';

const Payments = () => {
    const { user, hasPermission } = useAuth();
    const [loading, setLoading] = useState(true);

    // User Data
    const [myDues, setMyDues] = useState([]);

    // Admin Data
    const [stats, setStats] = useState({});
    const [adminList, setAdminList] = useState([]); // List of transactions for admin view
    const [adminFilter, setAdminFilter] = useState('REQUESTED'); // 'REQUESTED', 'PENDING' (All dues), 'PAID' (History)
    const [statsLoading, setStatsLoading] = useState(false);
    const [showAdminDetails, setShowAdminDetails] = useState(false); // Toggle detailed view

    // Selection
    const [selectedIds, setSelectedIds] = useState([]);
    const [processing, setProcessing] = useState(false);

    const isAdminOrStaff = hasPermission('approve_checkout') || user.role === 'Admin' || user.role === 'Incharge';

    useEffect(() => {
        fetchMyDues();
        if (isAdminOrStaff) {
            fetchStats();
            fetchAdminList(adminFilter);
        }
    }, [user]);

    // Fetch My Dues (For Everyone)
    const fetchMyDues = async () => {
        try {
            const res = await api.get('/payments/my');
            setMyDues(res.data);
        } catch (e) { console.error("Failed to fetch dues", e); }
        finally { setLoading(false); }
    };

    // Fetch Admin Stats
    const fetchStats = async () => {
        try {
            const res = await api.get('/payments/stats');
            setStats(res.data);
        } catch (e) { console.error(e); }
    };

    // Fetch Admin List (Who owes what)
    const fetchAdminList = async (status) => {
        setStatsLoading(true);
        try {
            // Need to update backend to support 'PENDING' filter properly if not already
            const res = await api.get(`/payments/pending?status=${status}`);
            setAdminList(res.data);
        } catch (e) { console.error(e); }
        finally { setStatsLoading(false); }
    };

    const handleStatClick = (filterType) => {
        setAdminFilter(filterType);
        fetchAdminList(filterType);
        setShowAdminDetails(true);
        // Scroll to details
        setTimeout(() => {
            document.getElementById('admin-details')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleRequestPayment = async () => {
        if (selectedIds.length === 0) return;
        setProcessing(true);
        try {
            await api.post('/payments/request', { transaction_ids: selectedIds });
            fetchMyDues();
            setSelectedIds([]);
            alert("Payment verification requested! Please pay the amount to the in-charge.");
        } catch (e) {
            alert("Failed to request payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleApprovePayment = async (ids) => {
        if (!ids || ids.length === 0) return;
        setProcessing(true);
        try {
            await api.post('/payments/approve', { transaction_ids: ids, method: 'Cash' });
            fetchAdminList(adminFilter);
            fetchStats();
            alert("Payment approved!");
        } catch (e) {
            alert("Failed to approve payment");
        } finally {
            setProcessing(false);
        }
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // --- RENDER HELPERS ---

    const StatsCard = ({ title, value, color, icon: Icon, onClick, active }) => (
        <Card
            onClick={onClick}
            className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] border-2",
                active ? `border-${color}-500 ring-2 ring-${color}-200` : "border-transparent",
                `bg-${color}-50`
            )}
        >
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <p className={`text-xs font-bold text-${color}-600 uppercase tracking-wider`}>{title}</p>
                    <Icon className={`w-5 h-5 text-${color}-600 opacity-50`} />
                </div>
                <div>
                    <h3 className={`text-2xl font-bold text-${color}-900`}>₹{value || 0}</h3>
                </div>
            </CardContent>
        </Card>
    );

    const MyDuesSection = () => {
        const totalDue = myDues.reduce((sum, item) => sum + (item.total_due || 0), 0);
        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                    {/* Background Patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-indigo-100 font-medium text-sm mb-1">My Outstanding Dues</h2>
                                <h1 className="text-5xl font-bold tracking-tight">₹{totalDue.toFixed(0)}</h1>
                            </div>
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                                <Wallet className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {myDues.length > 0 ? (
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {myDues.slice(0, 3).map((d, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-indigo-800 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                                {d.type[0]}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium">{myDues.length} Items pending</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-0"
                                    onClick={() => document.getElementById('my-dues-list').scrollIntoView({ behavior: 'smooth' })}
                                >
                                    View Details
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-indigo-100 bg-white/10 p-3 rounded-xl border border-white/10">
                                <Check className="w-5 h-5 text-emerald-300" />
                                <span className="font-medium text-sm">No pending dues. You're all good!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dues List */}
                {myDues.length > 0 && (
                    <div id="my-dues-list" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-4 h-4 text-gray-500" /> Details
                            </h3>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                {selectedIds.length} Selected
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {myDues.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => item.payment_status === 'PENDING' && toggleSelection(item.id)}
                                    className={cn(
                                        "p-4 flex items-center justify-between transition-colors cursor-pointer",
                                        selectedIds.includes(item.id) ? "bg-indigo-50/50" : "hover:bg-gray-50",
                                        item.payment_status === 'REQUESTED' && "bg-amber-50/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            {item.payment_status === 'PENDING' ? (
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    selectedIds.includes(item.id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                                                )}>
                                                    {selectedIds.includes(item.id) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                                                    <Clock className="w-3 h-3 text-amber-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.item_title}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(item.return_date), 'MMM d')} • {item.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">₹{item.total_due}</p>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            item.payment_status === 'REQUESTED' ? "text-amber-600" : "text-gray-400"
                                        )}>
                                            {item.payment_status === 'REQUESTED' ? 'Verifying' : 'Pay'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pay Button Sticky Footer */}
                        {selectedIds.length > 0 && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <Button
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 h-11 text-base"
                                    onClick={(e) => { e.stopPropagation(); handleRequestPayment(); }}
                                    isLoading={processing}
                                >
                                    Pay ₹{myDues.filter(i => selectedIds.includes(i.id)).reduce((s, i) => s + i.total_due, 0)}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const AdminDashboard = () => (
        <div className="space-y-6 pt-6 border-t border-gray-200/60 mt-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Admin Dashboard</h2>
                    <p className="text-xs text-gray-500">Manage collections and approvals</p>
                </div>
                <Button size="sm" variant="outline" onClick={fetchStats}><RotateCcw className="w-4 h-4" /></Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard
                    title="Total Collected"
                    value={stats.total_collected}
                    color="emerald"
                    icon={ShieldCheck}
                    active={adminFilter === 'PAID'}
                    onClick={() => handleStatClick('PAID')}
                />
                <StatsCard
                    title="Pending (All)"
                    value={stats.total_pending}
                    color="amber"
                    icon={Clock}
                    active={adminFilter === 'PENDING'}
                    onClick={() => handleStatClick('PENDING')}
                />
                <StatsCard
                    title="Requests"
                    value={stats.rent_pending} /* Proxy for requests count maybe? Or just keep generic */
                    color="indigo"
                    icon={Banknote}
                    active={adminFilter === 'REQUESTED'}
                    onClick={() => handleStatClick('REQUESTED')}
                />
                <StatsCard
                    title="Fines Due"
                    value={stats.fine_pending}
                    color="rose"
                    icon={AlertCircle}
                    active={adminFilter === 'FINE'} /* Custom filter if needed */
                // onClick={() => handleStatClick('PENDING')}
                />
            </div>

            {/* Detailed Admin List */}
            <div id="admin-details" className="bg-white rounded-2xl border border-gray-200 shadow-sm scroll-mt-24">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        {adminFilter === 'REQUESTED' && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        <h3 className="font-bold text-gray-900">
                            {adminFilter === 'REQUESTED' ? 'Payment Requests' :
                                adminFilter === 'PENDING' ? 'All Pending Dues' : 'Payment History'}
                        </h3>
                    </div>
                    {/* Could add Search bar here */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={adminFilter === 'REQUESTED' ? "secondary" : "ghost"}
                            onClick={() => handleStatClick('REQUESTED')}
                            className="text-xs"
                        >
                            Requests
                        </Button>
                        <Button
                            size="sm"
                            variant={adminFilter === 'PENDING' ? "secondary" : "ghost"}
                            onClick={() => handleStatClick('PENDING')}
                            className="text-xs"
                        >
                            All Due
                        </Button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {statsLoading ? (
                        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : adminList.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-sm font-medium">No records found for this filter.</p>
                        </div>
                    ) : (
                        adminList.map(item => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {item.borrower_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.borrower_name}</p>
                                            <p className="text-xs text-gray-500">{item.borrower_roll}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">₹{item.total_amount}</p>
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                                            item.payment_status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                item.payment_status === 'REQUESTED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                    "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {item.payment_status}
                                        </span>
                                    </div>
                                </div>
                                <div className="pl-11 flex justify-between items-center text-xs">
                                    <div className="text-gray-500 space-x-2">
                                        <span>{item.item_title}</span>
                                        <span>•</span>
                                        <span>Returned: {item.return_date ? format(new Date(item.return_date), 'MMM d') : 'N/A'}</span>
                                    </div>

                                    {item.payment_status === 'REQUESTED' && (
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleApprovePayment([item.id])}
                                            isLoading={processing}
                                        >
                                            Approve
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="max-w-3xl mx-auto p-4 pb-32 space-y-6 animate-in fade-in">
            {/* Common Section for Everyone */}
            <MyDuesSection />

            {/* Admin Section */}
            {isAdminOrStaff && <AdminDashboard />}
        </div>
    );
};

export default Payments;
