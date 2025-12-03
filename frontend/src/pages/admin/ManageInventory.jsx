import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Plus, Search, Edit, Trash } from 'lucide-react';

const ManageInventory = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/inventory/', { params: { search } });
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <Link to="/admin/inventory/add">
                    <Button size="sm" className="bg-indigo-600">
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </Link>
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
                                <h3 className="font-medium text-gray-900">{item.title}</h3>
                                <p className="text-xs text-gray-500">{item.type} • {item.quantity_available}/{item.quantity_total}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </Button>
                                {/* Delete button could go here */}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ManageInventory;
