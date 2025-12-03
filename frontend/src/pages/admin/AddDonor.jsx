import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';

const AddDonor = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile_number: '',
        branch: '',
        batch: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/inventory/donors', formData);
            navigate('/admin/donors');
        } catch (error) {
            console.error("Failed to add donor", error);
            alert("Failed to add donor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Donor</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Name</label>
                            <Input name="name" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <Input type="email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <Input name="mobile_number" value={formData.mobile_number} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Branch</label>
                                <Input name="branch" value={formData.branch} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Batch</label>
                                <Input name="batch" value={formData.batch} onChange={handleChange} />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            <Save className="w-4 h-4 mr-2" /> Save Donor
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddDonor;
