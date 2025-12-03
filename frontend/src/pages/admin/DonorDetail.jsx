import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, ArrowLeft, User, Gift, Mail, Phone, MapPin } from 'lucide-react';

const DonorDetail = () => {
    const { donorId } = useParams();
    const navigate = useNavigate();
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We need a backend endpoint to get single donor details + items
        // Currently we only have list_donors. 
        // I'll assume we add GET /inventory/donors/:id or filter list for now if backend update is too much.
        // Actually, let's just fetch all and find (prototype hack) or better, add the endpoint.
        // I'll add the endpoint to backend in next step if needed, or just use list for now.
        // Let's try to fetch list and find.
        fetchDonorDetail();
    }, [donorId]);

    const fetchDonorDetail = async () => {
        try {
            // Ideally: await api.get(`/inventory/donors/${donorId}`);
            // For now, let's fetch all and filter since we didn't explicitly create a single donor endpoint yet.
            const response = await api.get('/inventory/donors');
            const found = response.data.find(d => d.id === parseInt(donorId));
            setDonor(found);

            // Also fetch items donated by this donor?
            // We can search inventory by donor_id if we add that filter.
            // For now, just show profile.
        } catch (error) {
            console.error("Failed to fetch donor", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!donor) return <div className="p-8 text-center">Donor not found</div>;

    return (
        <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Card */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" /> Donor Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                                {donor.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{donor.name}</h2>
                                <p className="text-sm text-gray-500">{donor.branch} • {donor.batch}</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            {donor.email && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{donor.email}</span>
                                </div>
                            )}
                            {donor.mobile_number && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{donor.mobile_number}</span>
                                </div>
                            )}
                            {donor.address && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{donor.address}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Donated Items */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5" /> Donated Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 italic">
                            List of donated items will appear here.
                        </p>
                        {/* TODO: Fetch items where donor_id = donorId */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DonorDetail;
