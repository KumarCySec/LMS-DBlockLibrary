import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';

const AddItem = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        type: 'Book',
        isbn: '',
        quantity_total: 1,
        description: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/inventory/', formData);
            navigate('/admin/inventory');
        } catch (error) {
            console.error("Failed to add item", error);
            alert("Failed to add item");
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
                    <CardTitle>Add New Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Title</label>
                            <Input name="title" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Author / Brand</label>
                                <Input name="author" value={formData.author} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="Book">Book</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Kit">Kit</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">ISBN / Serial No</label>
                                <Input name="isbn" value={formData.isbn} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Total Quantity</label>
                                <Input type="number" name="quantity_total" value={formData.quantity_total} onChange={handleChange} min="1" required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            <Save className="w-4 h-4 mr-2" /> Save Item
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddItem;
