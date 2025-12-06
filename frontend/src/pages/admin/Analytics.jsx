import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, TrendingUp, Users, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const [data, setData] = useState({
        activeCheckouts: 0,
        overdueCount: 0,
        mostBorrowed: [],
        topBorrowers: [],
        deptUsage: [],
        donorStats: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [activeRes, overdueRes, mostBorrowedRes, topBorrowersRes, deptRes, donorRes] = await Promise.all([
                api.get('/analytics/active-checkouts'),
                api.get('/analytics/overdue-count'),
                api.get('/analytics/most-borrowed'),
                api.get('/analytics/top-borrowers'),
                api.get('/analytics/department-usage'),
                api.get('/analytics/donor-stats')
            ]);

            setData({
                activeCheckouts: activeRes.data.active_checkouts,
                overdueCount: overdueRes.data.overdue_count,
                mostBorrowed: mostBorrowedRes.data,
                topBorrowers: topBorrowersRes.data,
                deptUsage: deptRes.data,
                donorStats: donorRes.data
            });
        } catch (err) {
            console.error("Failed to fetch analytics", err);
            setError("Unable to load analytics. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="text-red-500 font-medium">{error}</div>
                <Button onClick={fetchAnalytics} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/volunteer-analytics'}>
                        Volunteer Stats
                    </Button>
                    <Button size="sm" variant="ghost" onClick={fetchAnalytics}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <TrendingUp className="w-6 h-6 text-indigo-600 mb-2" />
                        <p className="text-2xl font-bold text-indigo-700">{data.activeCheckouts}</p>
                        <p className="text-xs text-indigo-600 font-medium">Active Loans</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-100">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <AlertCircle className="w-6 h-6 text-rose-600 mb-2" />
                        <p className="text-2xl font-bold text-rose-700">{data.overdueCount}</p>
                        <p className="text-xs text-rose-600 font-medium">Overdue</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Usage */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Checkouts by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        {data.deptUsage.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.deptUsage}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="department" fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="checkout_count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Checkouts" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </CardContent>
                </Card>

                {/* Most Borrowed Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Most Borrowed Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.mostBorrowed.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                    <div className="truncate max-w-[200px]">
                                        <span className="block text-sm font-medium text-gray-700 truncate">{item.title}</span>
                                        <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                                    </div>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{item.borrow_count} loans</span>
                                </div>
                            ))}
                            {data.mostBorrowed.length === 0 && <p className="text-sm text-gray-500 text-center">No data available</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Borrowers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Borrowers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topBorrowers.map((user, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{user.borrow_count} loans</span>
                                </div>
                            ))}
                            {data.topBorrowers.length === 0 && <p className="text-sm text-gray-500 text-center">No data available</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Donor Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Donors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.donorStats.map((donor, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                    <span className="text-sm font-medium text-gray-700">{donor.name}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{donor.items_donated} items</span>
                                </div>
                            ))}
                            {data.donorStats.length === 0 && <p className="text-sm text-gray-500 text-center">No data available</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
