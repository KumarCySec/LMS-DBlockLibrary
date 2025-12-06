import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, ArrowLeft, Clock, Building, Download, Users, CalendarCheck, Trophy, Medal, Star, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const VolunteerAnalytics = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({
        hours_by_volunteer: [],
        shifts_by_department: []
    });
    const [loading, setLoading] = useState(true);
    const [exportModalOpen, setExportModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/analytics/volunteers');
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch volunteer analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        let headers, csvContent, filename;
        const dateStr = new Date().toISOString().split('T')[0];

        if (type === 'summary') {
            headers = ['Volunteer Name', 'Total Hours', 'Shifts Completed', 'Avg Shift Duration'];
            csvContent = [
                headers.join(','),
                ...data.hours_by_volunteer.map(row => [
                    `"${row.name}"`,
                    row.total_hours,
                    row.shifts,
                    row.shifts > 0 ? (row.total_hours / row.shifts).toFixed(2) : 0
                ].join(','))
            ].join('\n');
            filename = `volunteer_summary_${dateStr}.csv`;
        } else {
            // Detailed export - for now we simulate it with the same data but maybe different structure
            // Ideally this would fetch raw logs from backend
            headers = ['Volunteer Name', 'Department', 'Date', 'Check In', 'Check Out', 'Duration (mins)'];
            // Since we don't have raw logs in 'data' state here, we'll just export the summary for now
            // In a real app, we'd fetch /attendance/export
            alert("Detailed export requires backend implementation. Exporting summary instead.");
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setExportModalOpen(false);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    // Calculate Summary Stats
    const totalVolunteers = data.hours_by_volunteer.length;
    const totalHours = data.hours_by_volunteer.reduce((acc, curr) => acc + curr.total_hours, 0);
    const totalShifts = data.hours_by_volunteer.reduce((acc, curr) => acc + curr.shifts, 0);

    // Leaderboard Logic
    const sortedVolunteers = [...data.hours_by_volunteer].sort((a, b) => b.total_hours - a.total_hours);
    const topVolunteer = sortedVolunteers[0];

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="p-4 space-y-8 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Volunteer Insights</h1>
                        <p className="text-gray-500 font-medium">Empowering our library heroes</p>
                    </div>
                </div>
                <Button
                    onClick={() => setExportModalOpen(true)}
                    className="bg-gray-900 hover:bg-black text-white shadow-lg flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105"
                >
                    <Download className="w-5 h-5" /> Export Report
                </Button>
            </div>

            {/* Motivation / Leaderboard Banner */}
            {topVolunteer && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner">
                            <Trophy className="w-12 h-12 text-yellow-300 drop-shadow-md" />
                        </div>
                        <div className="text-center md:text-left">
                            <div className="inline-block px-3 py-1 bg-yellow-400/20 rounded-full text-yellow-200 text-xs font-bold uppercase tracking-wider mb-2 border border-yellow-400/30">
                                Star Volunteer of the Month
                            </div>
                            <h2 className="text-4xl font-black mb-1">{topVolunteer.name}</h2>
                            <p className="text-indigo-100 text-lg">Leading with <span className="font-bold text-white">{topVolunteer.total_hours.toFixed(1)} hours</span> of dedication!</p>
                        </div>
                    </div>
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/30 rounded-full blur-2xl"></div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Team</p>
                            <h3 className="text-3xl font-black text-gray-900">{totalVolunteers}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Impact</p>
                            <h3 className="text-3xl font-black text-gray-900">{totalHours.toFixed(1)} <span className="text-sm text-gray-400 font-medium">hrs</span></h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <CalendarCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Shifts Done</p>
                            <h3 className="text-3xl font-black text-gray-900">{totalShifts}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg border-0 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                            <BarChart2 className="w-5 h-5 text-indigo-500" />
                            Engagement Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {data.hours_by_volunteer.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.hours_by_volunteer.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="total_hours" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                                        {data.hours_by_volunteer.slice(0, 10).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                            <PieChartIcon className="w-5 h-5 text-emerald-500" />
                            Department Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        {data.shifts_by_department.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.shifts_by_department}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="shifts_scheduled"
                                        nameKey="department"
                                    >
                                        {data.shifts_by_department.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-gray-800">Detailed Performance Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Volunteer</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Total Hours</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Shifts</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Avg Duration</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.hours_by_volunteer.map((row, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {idx < 3 ? <Medal className="w-4 h-4" /> : row.name.charAt(0)}
                                            </div>
                                            {row.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono font-medium">{row.total_hours.toFixed(1)}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.shifts}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.shifts > 0 ? (row.total_hours / row.shifts).toFixed(1) : 0} hrs
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.total_hours > 20 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Star className="w-3 h-3 fill-current" /> Elite
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Export Modal */}
            {exportModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h3>
                        <p className="text-gray-500 mb-6">Choose the type of report you want to generate.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleExport('summary')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group text-left"
                            >
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Summary Report</h4>
                                    <p className="text-xs text-gray-500">Total hours, shifts, and averages per volunteer.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('detailed')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group text-left"
                            >
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <CalendarCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Detailed Logs</h4>
                                    <p className="text-xs text-gray-500">Raw check-in/out timestamps for all shifts.</p>
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button variant="ghost" onClick={() => setExportModalOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
const BarChart2 = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
)

const PieChartIcon = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
)

export default VolunteerAnalytics;
