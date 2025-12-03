import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';

const ManageDonors = () => {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchDonors();
    }, [debouncedSearch]);

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (debouncedSearch) params.search = debouncedSearch;
            const response = await api.get('/inventory/donors', { params });
            setDonors(response.data);
        } catch (error) {
            console.error("Failed to fetch donors", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Manage Donors</h1>
                <Link to="/admin/donors/add">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Add Donor
                    </Button>
                </Link>
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
        </div>
    );
};

export default ManageDonors;
