import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';
import { Plus, Search, Edit, Trash, Book, Laptop, Box, Settings, Download, BarChart2 } from 'lucide-react';
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
        setFormData({ type: '', title: '', quantity_total: 1 });
        setStep(1);
        setShowModal(true);
    };

    const openEditModal = async (item) => {
        setIsEditing(true);
        setFormData({ ...item }); // Prefill
        setStep(2); // Skip type selection
        setShowModal(true);

        // Fetch copies
        try {
            const res = await api.get(`/inventory/${item.id}/copies`);
            setCopies(res.data);
        } catch (e) {
            console.error("Failed to fetch copies", e);
            setCopies([]);
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
            // Refresh items to update counts
            fetchItems();
        } catch (e) {
            alert("Failed to add copy: " + (e.response?.data?.error || e.message));
        } finally {
            setAddingCopy(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (isEditing) {
                await api.put(`/inventory/${formData.id}`, formData);
            } else {
                await api.post('/inventory/', { ...formData, copies: generatedCopies });
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

    // Form Tabs
    const [activeModalTab, setActiveModalTab] = useState('details'); // details, copies, donor
    const [newCopyAcc, setNewCopyAcc] = useState('');
    const [generatedCopies, setGeneratedCopies] = useState([]); // Temporary list for new item

    // Donor Search
    const [donorSearch, setDonorSearch] = useState('');
    const [donors, setDonors] = useState([]);
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [isCreatingDonor, setIsCreatingDonor] = useState(false);
    const [newDonor, setNewDonor] = useState({ name: '', branch: '', batch: '' });

    useEffect(() => {
        if (showModal && !isEditing) {
            setGeneratedCopies([]);
            setSelectedDonor(null);
            setFormData(prev => ({ ...prev, date_of_donation: new Date().toISOString().split('T')[0] }));
        }
    }, [showModal]);

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
        if (newCopyAcc && !generatedCopies.includes(newCopyAcc)) {
            setGeneratedCopies([...generatedCopies, newCopyAcc]);
            setNewCopyAcc('');
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

    const renderDetailsTab = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Name</label>
                <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Item Name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                    <Input type="date" value={formData.date_received || ''} onChange={e => setFormData({ ...formData, date_received: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Donated</label>
                    <Input type="date" value={formData.date_of_donation || ''} onChange={e => setFormData({ ...formData, date_of_donation: e.target.value })} />
                </div>
            </div>

            {formData.type === 'Book' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                        <Input value={formData.author || ''} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select value={formData.language || ''} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm">
                            <option value="">Select Language</option>
                            <option value="English">English</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Hindi">Hindi</option>
                        </select>
                    </div>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional details..." />
            </div>
        </div>
    );

    const renderCopiesTab = () => (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input placeholder="Enter Accession No." value={newCopyAcc} onChange={(e) => setNewCopyAcc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGeneratedCopy()} />
                <Button size="sm" onClick={handleAddGeneratedCopy} type="button">Add</Button>
            </div>
            <div className="bg-gray-50 p-2 rounded-md max-h-40 overflow-y-auto">
                {generatedCopies.length === 0 ? <p className="text-xs text-gray-500 text-center">No copies added yet.</p> : (
                    <div className="flex flex-wrap gap-2">
                        {generatedCopies.map((acc, idx) => (
                            <span key={idx} className="bg-white px-2 py-1 rounded border text-xs flex items-center gap-1">
                                {acc} <button onClick={() => setGeneratedCopies(generatedCopies.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500">Total Copies: {generatedCopies.length}</p>
        </div>
    );

    const renderDonorTab = () => (
        <div className="space-y-4">
            {!isCreatingDonor ? (
                <>
                    <div className="relative">
                        <Input placeholder="Search Donor..." value={donorSearch} onChange={(e) => searchDonors(e.target.value)} />
                        {donors.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {donors.map(d => (
                                    <div key={d.id} className="p-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => { setSelectedDonor(d); setFormData(prev => ({ ...prev, donor_id: d.id })); setDonors([]); setDonorSearch(''); }}>
                                        {d.name} ({d.branch})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedDonor && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-indigo-900">{selectedDonor.name}</p>
                                <p className="text-xs text-indigo-700">{selectedDonor.branch} • {selectedDonor.batch}</p>
                            </div>
                            <button onClick={() => setSelectedDonor(null)} className="text-indigo-500 hover:text-indigo-700 text-xs">Change</button>
                        </div>
                    )}
                    <div className="text-center">
                        <span className="text-xs text-gray-500">Or</span>
                        <button onClick={() => setIsCreatingDonor(true)} className="block w-full text-sm text-indigo-600 font-medium mt-1 hover:underline">Create New Donor</button>
                    </div>
                </>
            ) : (
                <div className="space-y-3 border p-3 rounded-lg bg-gray-50">
                    <h3 className="text-sm font-bold">New Donor</h3>
                    <Input placeholder="Name" value={newDonor.name} onChange={e => setNewDonor({ ...newDonor, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Branch (e.g. ECE)" value={newDonor.branch} onChange={e => setNewDonor({ ...newDonor, branch: e.target.value })} />
                        <Input placeholder="Batch (e.g. 2025)" value={newDonor.batch} onChange={e => setNewDonor({ ...newDonor, batch: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsCreatingDonor(false)} className="w-full">Cancel</Button>
                        <Button size="sm" onClick={handleCreateDonor} className="w-full">Create</Button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderForm = () => (
        <div className="space-y-4">
            {!isEditing && (
                <div className="flex gap-2 mb-4 border-b">
                    {['details', 'copies', 'donor'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveModalTab(tab)}
                            className={cn("px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize", activeModalTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {activeModalTab === 'details' && renderDetailsTab()}
            {activeModalTab === 'copies' && renderCopiesTab()}
            {activeModalTab === 'donor' && renderDonorTab()}
        </div>
    );

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
                <Card className="bg-rose-50 border-rose-100">
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
