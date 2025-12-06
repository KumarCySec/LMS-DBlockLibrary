import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Search, Plus, User, Phone, Mail, Edit2, X, Save, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const ManageDonors = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [departments, setDepartments] = useState([]);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchDonors();
    }, [debouncedSearch, branchFilter, batchFilter]);

    // Fetch Departments for Filter
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const response = await api.get('/common/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepts();
    }, []);

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (debouncedSearch) params.search = debouncedSearch;
            if (branchFilter) params.branch = branchFilter;
            if (batchFilter) params.batch = batchFilter;
            const response = await api.get('/inventory/donors', { params });
            setDonors(response.data);
        } catch (error) {
            console.error("Failed to fetch donors", error);
        } finally {
            setLoading(false);
        }
    };

    // Edit Modal State
    const [editingDonor, setEditingDonor] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Export Modal
    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (type = 'all') => {
        try {
            const params = {};
            if (type === 'current') {
                if (debouncedSearch) params.search = debouncedSearch;
                if (branchFilter) params.branch = branchFilter;
                if (batchFilter) params.batch = batchFilter;
            }

            const response = await api.get('/export/donors', { params, responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            saveAs(blob, `Donors_${type === 'all' ? 'All' : 'Filtered'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            setShowExportModal(false);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed");
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manage Donors</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowExportModal(true)} className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Link to="/admin/donors/add">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Add Donor
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search donors by name, branch, batch..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 max-w-xs w-full"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                >
                    <option value="">All Branches</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                </select>
                <Input
                    placeholder="Filter by Batch"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            {/* Donors List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : donors.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No donors found.
                    </div>
                ) : (
                    donors.map((donor) => (
                        <Link key={donor.id} to={`/admin/donors/${donor.id}`}>
                            <Card className="hover:shadow-md transition-all duration-200 border-gray-200 hover:border-indigo-200 h-full">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                {donor.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{donor.name}</h3>
                                                <p className="text-xs text-gray-500">{donor.branch} • {donor.batch}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingDonor(donor);
                                                setEditForm(donor);
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-indigo-600" />
                                        </Button>
                                    </div>

                                    <div className="pt-2 space-y-1">
                                        {donor.email && (
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Mail className="w-3 h-3 mr-2" /> {donor.email}
                                            </div>
                                        )}
                                        {donor.mobile_number && (
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Phone className="w-3 h-3 mr-2" /> {donor.mobile_number}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Edit Donor</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Branch</label>
                                    <Input
                                        value={editForm.branch || ''}
                                        onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Batch</label>
                                    <Input
                                        value={editForm.batch || ''}
                                        onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Mobile</label>
                                <Input
                                    value={editForm.mobile_number || ''}
                                    onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                <Button
                                    className="flex-1"
                                    isLoading={editLoading}
                                    onClick={async () => {
                                        setEditLoading(true);
                                        try {
                                            await api.put(`/inventory/donors/${editingDonor.id}`, editForm);
                                            setShowEditModal(false);
                                            fetchDonors();
                                        } catch (e) {
                                            alert("Failed to update donor");
                                        } finally {
                                            setEditLoading(false);
                                        }
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Export Donors</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div
                                onClick={() => handleExport('all')}
                                className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                            >
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <Download className="w-6 h-6 text-indigo-700" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Export All Donors</h3>
                                    <p className="text-sm text-gray-500">Download complete list of all donors.</p>
                                </div>
                            </div>

                            <div
                                onClick={() => handleExport('current')}
                                className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                            >
                                <div className="p-3 bg-emerald-100 rounded-full">
                                    <Search className="w-6 h-6 text-emerald-700" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Export Filtered List</h3>
                                    <p className="text-sm text-gray-500">Export donors matching current search/filter criteria.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDonors;
