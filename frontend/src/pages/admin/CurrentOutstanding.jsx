import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Book, User, Calendar, Search, Download, Filter, AlertCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CurrentOutstanding = () => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, OVERDUE, DUE_SOON

    useEffect(() => {
        fetchOutstandingItems();
    }, []);

    useEffect(() => {
        filterItems();
    }, [searchQuery, filter, items]);

    const fetchOutstandingItems = async () => {
        setLoading(true);
        try {
            // Fetch transactions with status ISSUED or OVERDUE or RENEW_REQUESTED or RETURN_REQUESTED
            // We can reuse /transactions endpoint with a custom param or multiple calls
            // For now, let's fetch all active statuses
            const statuses = ['ISSUED', 'OVERDUE', 'RENEW_REQUESTED', 'RETURN_REQUESTED'];
            const promises = statuses.map(status => api.get('/transactions/', { params: { status } }));
            const results = await Promise.all(promises);
            const allItems = results.flatMap(r => r.data);

            // Remove duplicates if any (though statuses are mutually exclusive usually)
            const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

            // Sort by due date (ascending - urgent first)
            uniqueItems.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

            setItems(uniqueItems);
        } catch (error) {
            console.error("Failed to fetch outstanding items", error);
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        let result = items;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.item_title.toLowerCase().includes(q) ||
                item.borrower_name.toLowerCase().includes(q) ||
                item.borrower_roll.toLowerCase().includes(q) ||
                item.copy_acc_no.toLowerCase().includes(q)
            );
        }

        if (filter === 'OVERDUE') {
            result = result.filter(item => item.status === 'OVERDUE' || new Date(item.due_date) < new Date());
        } else if (filter === 'DUE_SOON') {
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);
            result = result.filter(item => {
                const dueDate = new Date(item.due_date);
                return dueDate >= today && dueDate <= threeDaysFromNow;
            });
        }

        setFilteredItems(result);
    };

    const exportToExcel = () => {
        const data = filteredItems.map(item => ({
            "Title": item.item_title,
            "Accession No": item.copy_acc_no,
            "Borrower": item.borrower_name,
            "Roll No": item.borrower_roll,
            "Department": item.borrower_dept,
            "Issue Date": format(new Date(item.issue_date), 'dd/MM/yyyy'),
            "Due Date": format(new Date(item.due_date), 'dd/MM/yyyy'),
            "Status": item.status,
            "Days Overdue": new Date(item.due_date) < new Date() ? differenceInDays(new Date(), new Date(item.due_date)) : 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Items");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `Outstanding_Items_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Clock className="w-6 h-6 text-indigo-600" />
                        Current Outstanding Items
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track all items currently issued to users</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items or users..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Outstanding</p>
                            <h3 className="text-2xl font-bold text-gray-900">{items.length}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Book className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Overdue</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {items.filter(i => i.status === 'OVERDUE' || new Date(i.due_date) < new Date()).length}
                            </h3>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Due Soon (3 Days)</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {items.filter(i => {
                                    const due = new Date(i.due_date);
                                    const today = new Date();
                                    const diff = differenceInDays(due, today);
                                    return diff >= 0 && diff <= 3;
                                }).length}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['ALL', 'OVERDUE', 'DUE_SOON'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                            filter === f
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading outstanding items...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Book className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                        <p className="text-gray-500 text-sm mt-1">There are no outstanding items matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Item</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Borrower</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Due Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map((item) => {
                                    const isOverdue = new Date(item.due_date) < new Date();
                                    const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(item.due_date)) : 0;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                        <Book className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1">{item.item_title}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{item.copy_acc_no}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.borrower_name}</p>
                                                    <p className="text-xs text-gray-500">{item.borrower_roll}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={cn("font-medium", isOverdue ? "text-rose-600" : "text-gray-900")}>
                                                        {format(new Date(item.due_date), 'MMM d, yyyy')}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="text-xs text-rose-500 font-bold">
                                                            {daysOverdue} days overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-bold border",
                                                    item.status === 'OVERDUE' || isOverdue ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                        item.status === 'ISSUED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                            "bg-gray-100 text-gray-700 border-gray-200"
                                                )}>
                                                    {item.status === 'ISSUED' && isOverdue ? 'OVERDUE' : item.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrentOutstanding;
