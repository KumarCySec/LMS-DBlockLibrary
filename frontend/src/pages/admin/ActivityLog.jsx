import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Activity, Download, ChevronLeft, ChevronRight, Calendar, Filter, RefreshCw } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';

const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState('ALL');
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [currentDate, filterType, showAll]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                per_page: 100
            };
            if (!showAll) {
                params.date = format(currentDate, 'yyyy-MM-dd');
            }
            if (filterType !== 'ALL') params.type = filterType;

            const res = await api.get('/activity', { params });
            setLogs(res.data.logs);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (type) => { // 'all' or 'current_date'
        try {
            const params = {};
            if (type === 'date') {
                params.date = format(currentDate, 'yyyy-MM-dd');
            }
            const response = await api.get('/export/activity', { params, responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Activity_Log_${type === 'all' ? 'All' : format(currentDate, 'yyyy-MM-dd')}.xlsx`);
            setShowExportModal(false);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed");
        }
    };

    const getActionColor = (action) => {
        if (action.includes('CHECKOUT')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (action.includes('RETURN')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (action.includes('RENEW')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (action.includes('PUNCH')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (action.includes('LIBRARY')) return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getActionIcon = (action) => {
        // You can add specific icons here if needed
        return null;
    };

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        {showAll ? 'Activity History' : 'Daily Activity Log'}
                    </h1>
                    <p className="text-gray-500">
                        {showAll ? 'Showing detailed history of all library actions' : `Track all library actions for ${format(currentDate, 'MMMM d, yyyy')}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant={showAll ? "secondary" : "outline"} onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Daily View' : 'View All History'}
                    </Button>
                    <Button variant="outline" onClick={() => fetchLogs()} disabled={loading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setShowExportModal(true)} disabled={logs.length === 0}>
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            {/* Date Surfing & Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                {!showAll && (
                    <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-xl">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center font-medium text-gray-700">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM d, yyyy')}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isSameDay(currentDate, new Date())}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}
                {showAll && <div className="text-sm font-medium text-gray-500 italic">Showing most recent activities</div>}

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'CHECKOUT', 'RETURN', 'RENEW', 'PUNCH', 'LIBRARY'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                                filterType === type
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {type === 'ALL' ? 'All Activity' : type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16 pl-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No activity recorded</h3>
                        <p className="text-gray-500">There were no actions logged on this date.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={log.id} className="relative flex items-start gap-4 group animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className={cn(
                                "absolute left-6 w-3 h-3 rounded-full border-2 border-white shadow-sm mt-1.5 z-10",
                                log.action.includes('CHECKOUT') ? "bg-blue-500" :
                                    log.action.includes('RETURN') ? "bg-emerald-500" :
                                        log.action.includes('RENEW') ? "bg-amber-500" :
                                            log.action.includes('PUNCH') ? "bg-purple-500" :
                                                log.action.includes('LIBRARY') ? "bg-rose-500" : "bg-gray-400"
                            )}></div>

                            <div className="pl-12 w-full">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group-hover:border-indigo-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getActionColor(log.action))}>
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">
                                                {format(new Date(log.created_at), 'h:mm a')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            IP: {log.ip}
                                        </div>
                                    </div>

                                    <p className="text-gray-900 font-medium text-sm">{log.details}</p>

                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px]">
                                            {log.user[0]}
                                        </div>
                                        <span>{log.user}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Export Modal */}
            {
                showExportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg">Export Activity</h3>
                                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <ChevronLeft className="w-5 h-5 rotate-180" /> {/* Using Chevron as X fallback if X not imported, or just close */}
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div
                                    onClick={() => handleExport('all')}
                                    className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                                >
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <Activity className="w-6 h-6 text-indigo-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Export All History</h3>
                                        <p className="text-sm text-gray-500">Download the complete activity log since beginning.</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleExport('date')}
                                    className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                                >
                                    <div className="p-3 bg-emerald-100 rounded-full">
                                        <Calendar className="w-6 h-6 text-emerald-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Export for {format(currentDate, 'MMM d, yyyy')}</h3>
                                        <p className="text-sm text-gray-500">Download activity only for the currently selected date.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ActivityLog;
