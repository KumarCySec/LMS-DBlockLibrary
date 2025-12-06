import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';
import { Plus, Search, Edit, Trash, Book, Laptop, Box, Settings, Download, BarChart2, Loader2, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const ManageInventory = () => {
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({});
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // All, Book, Laptop, Kit
    const [customCategories, setCustomCategories] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [step, setStep] = useState(1); // 1: Type Selection, 2: Details
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // Copies Management
    const [copies, setCopies] = useState([]);
    const [newAccNo, setNewAccNo] = useState('');
    const [addingCopy, setAddingCopy] = useState(false);

    // Generated Copies (for new items)
    const [generatedCopies, setGeneratedCopies] = useState([]);

    // Donor Search
    const [donorSearch, setDonorSearch] = useState('');
    const [donors, setDonors] = useState([]);
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [isCreatingDonor, setIsCreatingDonor] = useState(false);
    const [newDonor, setNewDonor] = useState({ name: '', branch: '', batch: '' });

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const fetchItems = async () => {
        try {
            const params = { search };
            if (activeTab !== 'All') params.type = activeTab;

            const [itemsRes, statsRes] = await Promise.all([
                api.get('/inventory/', { params }),
                api.get('/inventory/stats')
            ]);

            setItems(itemsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    const handleExport = async (type) => {
        try {
            const endpoint = type === 'master' ? '/export/master' : '/export/summary';
            const response = await api.get(endpoint, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Inventory_${type === 'master' ? 'Master' : 'Summary'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            setShowExportModal(false);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed");
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ type: '', title: '', quantity_total: 1, status: 'active' });
        setStep(1);
        setShowModal(true);
        setGeneratedCopies([]);
        setSelectedDonor(null);
    };

    const openEditModal = async (item) => {
        setIsEditing(true);
        setStep(2); // Direct to form
        setShowModal(true);
        setLoading(true);

        try {
            // Fetch full details
            const res = await api.get(`/inventory/${item.id}`);
            const detail = res.data;
            // Map detail to formData
            setFormData({
                ...detail,
                // Ensure serial number is available
                serial_number: detail.serial_number || (detail.type === 'Laptop' ? detail.copies?.[0]?.acc_no : '')
            });

            if (detail.donor) {
                setSelectedDonor(detail.donor);
            } else {
                setSelectedDonor(null);
            }

            setCopies(detail.copies || []);
        } catch (e) {
            console.error("Failed to fetch details", e);
            // Fallback
            setFormData({ ...item });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = { ...formData };

            // Fix Donor ID
            if (selectedDonor) {
                payload.donor_id = selectedDonor.id;
            }

            // Handle Laptop Logic
            if (payload.type === 'Laptop') {
                // Ensure Quantity is 1
                payload.quantity_total = 1;
                // Use Serial Number as the Copy Accession Number
                if (payload.serial_number) {
                    payload.copies = [payload.serial_number];
                }
                // Map Title if missing (use Model)
                if (!payload.title && payload.model) payload.title = payload.model;
            } else {
                // For books, use generated copies
                if (!isEditing && generatedCopies.length > 0) {
                    payload.copies = generatedCopies;
                }
            }

            if (isEditing) {
                await api.put(`/inventory/${formData.id}`, payload);
            } else {
                await api.post('/inventory/', payload);
            }
            setShowModal(false);
            fetchItems();
        } catch (error) {
            console.error("Failed to save item", error);
            alert("Failed to save item: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAddCopy = async () => {
        if (!newAccNo) return;
        setAddingCopy(true);
        try {
            await api.post(`/inventory/${formData.id}/copies`, { acc_no: newAccNo });
            setNewAccNo('');
            // Refresh copies
            const res = await api.get(`/inventory/${formData.id}/copies`);
            setCopies(res.data);
            fetchItems();
        } catch (e) {
            alert("Failed to add copy: " + (e.response?.data?.error || e.message));
        } finally {
            setAddingCopy(false);
        }
    };

    const searchDonors = async (term) => {
        setDonorSearch(term);
        if (term.length > 2) {
            try {
                const res = await api.get(`/inventory/donors?search=${term}`);
                setDonors(res.data);
            } catch (e) { console.error(e); }
        } else {
            setDonors([]);
        }
    };

    const handleAddGeneratedCopy = () => {
        if (newAccNo && !generatedCopies.includes(newAccNo)) {
            setGeneratedCopies([...generatedCopies, newAccNo]);
            setNewAccNo('');
        }
    };

    const handleCreateDonor = async () => {
        try {
            const res = await api.post('/inventory/donors', newDonor);
            setSelectedDonor({ id: res.data.id, ...newDonor });
            setIsCreatingDonor(false);
            setFormData(prev => ({ ...prev, donor_id: res.data.id }));
        } catch (e) {
            alert("Failed to create donor");
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderTypeSelection = () => (
        <div className="grid grid-cols-2 gap-4">
            {['Book', 'Laptop', 'Kit', 'Other'].map(type => (
                <div
                    key={type}
                    onClick={() => { setFormData({ ...formData, type }); setStep(2); }}
                    className="p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                >
                    {type === 'Book' && <Book className="w-8 h-8 text-indigo-500" />}
                    {type === 'Laptop' && <Laptop className="w-8 h-8 text-pink-500" />}
                    {type === 'Kit' && <Box className="w-8 h-8 text-orange-500" />}
                    {type === 'Other' && <Settings className="w-8 h-8 text-gray-500" />}
                    <span className="font-medium text-gray-700">{type}</span>
                </div>
            ))}
        </div>
    );

    const renderDonorSection = () => (
        <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Donor Details</h3>
            {!isCreatingDonor ? (
                <>
                    <div className="relative">
                        <Input
                            placeholder="Search Donor by Name..."
                            value={donorSearch}
                            onChange={(e) => searchDonors(e.target.value)}
                            className="bg-white"
                        />
                        {donors.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                                {donors.map(d => (
                                    <div key={d.id} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm border-b last:border-0" onClick={() => { setSelectedDonor(d); setFormData(prev => ({ ...prev, donor_id: d.id })); setDonors([]); setDonorSearch(''); }}>
                                        <p className="font-medium text-gray-800">{d.name}</p>
                                        <p className="text-xs text-gray-500">{d.branch} • {d.batch}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedDonor && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center animate-in fade-in">
                            <div>
                                <p className="font-bold text-indigo-900 text-sm">{selectedDonor.name}</p>
                                <p className="text-xs text-indigo-700">{selectedDonor.branch} • {selectedDonor.batch}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDonor(null)} className="text-indigo-600 hover:text-indigo-800 h-6 px-2 text-xs">Change</Button>
                        </div>
                    )}
                    <div className="text-right">
                        <button onClick={() => setIsCreatingDonor(true)} className="text-xs text-indigo-600 font-bold hover:underline">+ Create New Donor</button>
                    </div>
                </>
            ) : (
                <div className="space-y-3 border p-3 rounded-lg bg-white shadow-sm">
                    <h3 className="text-sm font-bold">New Donor</h3>
                    <Input placeholder="Name" value={newDonor.name} onChange={e => setNewDonor({ ...newDonor, name: e.target.value })} className="h-9" />
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Branch" value={newDonor.branch} onChange={e => setNewDonor({ ...newDonor, branch: e.target.value })} className="h-9" />
                        <Input placeholder="Batch" value={newDonor.batch} onChange={e => setNewDonor({ ...newDonor, batch: e.target.value })} className="h-9" />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setIsCreatingDonor(false)} className="flex-1">Cancel</Button>
                        <Button size="sm" onClick={handleCreateDonor} className="flex-1 bg-indigo-600">Create</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Donated Date</label>
                    <Input type="date" value={formData.date_of_donation ? formData.date_of_donation.split('T')[0] : ''} onChange={e => setFormData({ ...formData, date_of_donation: e.target.value })} className="bg-white mt-1" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Received Date</label>
                    <Input type="date" value={formData.date_received ? formData.date_received.split('T')[0] : ''} onChange={e => setFormData({ ...formData, date_received: e.target.value })} className="bg-white mt-1" />
                </div>
            </div>
        </div>
    );

    const renderBookFields = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Book Title" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Author</label>
                    <Input value={formData.author || ''} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="Author Name" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Language</label>
                    <select value={formData.language || ''} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                        <option value="">Select Language</option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Hindi">Hindi</option>
                    </select>
                </div>
                {!isEditing && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Copies to Add</label>
                        <div className="flex gap-2">
                            <Input placeholder="Acc No" value={newAccNo} onChange={(e) => setNewAccNo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGeneratedCopy()} />
                            <Button size="sm" onClick={handleAddGeneratedCopy} type="button">Add</Button>
                        </div>
                    </div>
                )}
            </div>

            {!isEditing && generatedCopies.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    {generatedCopies.map((acc, idx) => (
                        <span key={idx} className="bg-white px-2 py-1 rounded border text-xs flex items-center gap-1 shadow-sm">
                            {acc} <button onClick={() => setGeneratedCopies(generatedCopies.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                        </span>
                    ))}
                    <span className="text-xs text-gray-500 self-center ml-auto">Total: {generatedCopies.length}</span>
                </div>
            )}
        </>
    );

    const renderLaptopFields = () => (
        <>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Model Name</label>
                <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value, model: e.target.value })} placeholder="e.g. Dell XPS 15" className="font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Serial Number (Unique)</label>
                    <Input value={formData.serial_number || ''} onChange={e => setFormData({ ...formData, serial_number: e.target.value })} placeholder="Serial No." className="font-mono text-sm" />
                    <p className="text-[10px] text-gray-500">This will be used as the Accession Number.</p>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Brand/Make</label>
                    <Input value={formData.author || ''} onChange={e => setFormData({ ...formData, author: e.target.value })} placeholder="e.g. Dell" />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Technical Specs</label>
                <textarea
                    value={formData.specs || ''}
                    onChange={e => setFormData({ ...formData, specs: e.target.value })}
                    placeholder="Processor, RAM, Storage, etc."
                    className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
            </div>
        </>
    );

    const renderForm = () => {
        if (loading && isEditing) {
            return <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-sm">Loading details...</p></div>;
        }

        return (
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                {/* 1. Basic Info Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {formData.type === 'Laptop' ? <Laptop className="w-4 h-4 text-pink-500" /> : <Book className="w-4 h-4 text-indigo-500" />}
                            {formData.type} Details
                        </h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status:</label>
                            <select
                                value={formData.status || 'active'}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="h-7 text-xs rounded border border-gray-200 bg-gray-50 px-2 outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="retired">Retired</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                    </div>

                    {formData.type === 'Laptop' ? renderLaptopFields() : renderBookFields()}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description / Notes</label>
                        <Input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional notes..." />
                    </div>
                </div>

                {/* 2. Donor Section */}
                {renderDonorSection()}

                {/* 3. Existing Copies List (Only for Books or if Laptop has multiple for some reason) */}
                {isEditing && (
                    <div className="space-y-3 pt-4 border-t">
                        <h3 className="text-sm font-bold text-gray-900">Current Copies ({copies.length})</h3>
                        {copies.length === 0 ? <p className="text-sm text-gray-500 italic">No physical copies found.</p> : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {copies.map(copy => (
                                    <div key={copy.id} className="p-2 border rounded bg-white text-xs flex justify-between items-center">
                                        <span className="font-mono font-medium">{copy.acc_no}</span>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", copy.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                                            {copy.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Allow adding copy for Books only in Edit mode */}
                        {formData.type === 'Book' && (
                            <div className="flex gap-2 mt-2">
                                <Input placeholder="New Acc No" value={newAccNo} onChange={(e) => setNewAccNo(e.target.value)} className="h-8 text-sm" />
                                <Button size="sm" onClick={handleAddCopy} isLoading={addingCopy} className="h-8">Add Copy</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowExportModal(true)} className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button size="sm" className="bg-indigo-600" onClick={openAddModal}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-indigo-600 uppercase">Total Titles</p>
                        <p className="text-2xl font-bold text-indigo-900">{stats.total_items || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-blue-600 uppercase">Total Copies</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.total_copies || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-emerald-600 uppercase">Available Copies</p>
                        <p className="text-2xl font-bold text-emerald-900">{stats.available_copies || 0}</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/admin/inventory/outstanding'}>
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-rose-600 uppercase">Active Loans</p>
                        <p className="text-2xl font-bold text-rose-900">{stats.active_checkouts || 0}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Book', 'Laptop', 'Kit'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            activeTab === tab
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit" variant="outline" size="icon">
                    <Search className="w-4 h-4" />
                </Button>
            </form>

            <div className="space-y-2">
                {items.map((item) => (
                    <Card key={item.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <Link to={`/catalog/${item.id}`} className="hover:underline">
                                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                                </Link>
                                <p className="text-xs text-gray-500">{item.type} • {item.quantity_available}/{item.quantity_total}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(item)}>
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <BottomSheet
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? "Edit Item" : (step === 1 ? "Select Type" : "Add Item")}
                footer={
                    step === 2 && (
                        <Button className="w-full" onClick={handleSave} isLoading={loading}>
                            {isEditing ? "Save Changes" : "Create Item"}
                        </Button>
                    )
                }
            >
                {step === 1 ? renderTypeSelection() : renderForm()}
            </BottomSheet>

            {/* Export Modal */}
            <BottomSheet
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Inventory"
            >
                <div className="space-y-4 p-4">
                    <div
                        onClick={() => handleExport('master')}
                        className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-green-50 hover:border-green-200 transition-colors"
                    >
                        <div className="p-3 bg-green-100 rounded-full">
                            <Download className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Master Export</h3>
                            <p className="text-sm text-gray-500">Detailed list of every single copy, including accession numbers and donor details.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => handleExport('summary')}
                        className="p-4 border rounded-xl flex items-center gap-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                        <div className="p-3 bg-blue-100 rounded-full">
                            <BarChart2 className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Summary Export</h3>
                            <p className="text-sm text-gray-500">Overview of items with total quantities and availability counts.</p>
                        </div>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};

export default ManageInventory;
