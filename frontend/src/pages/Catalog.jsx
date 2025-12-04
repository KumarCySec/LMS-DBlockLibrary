import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Filter, Book, Laptop, Box, ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';

const Catalog = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
    const [languageFilter, setLanguageFilter] = useState(searchParams.get('language') || '');
    const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('availability') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Sync state to URL
    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (typeFilter) params.type = typeFilter;
        if (languageFilter) params.language = languageFilter;
        if (availabilityFilter) params.availability = availabilityFilter;
        if (sort) params.sort = sort;
        setSearchParams(params);
    }, [search, typeFilter, languageFilter, availabilityFilter, sort]);

    useEffect(() => {
        fetchItems();
    }, [typeFilter, languageFilter, availabilityFilter, sort, searchParams]); // Refetch when filters change or URL changes

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (languageFilter) params.language = languageFilter;
            if (availabilityFilter) params.availability = availabilityFilter;
            if (sort) params.sort = sort;

            const response = await api.get('/inventory/', { params });
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchItems();
    };

    const getTypeIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'book': return <Book className="w-5 h-5 text-indigo-500" />;
            case 'laptop': return <Laptop className="w-5 h-5 text-pink-500" />;
            case 'kit': return <Box className="w-5 h-5 text-orange-500" />;
            default: return <Box className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>

            {/* Search & Filter */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search by title, author, or acc no..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button type="submit" size="icon" variant="primary">
                    <Search className="w-4 h-4" />
                </Button>
            </form>

            {/* Filter Tabs & Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full sm:w-auto">
                    {['', 'Book', 'Laptop', 'Kit'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                typeFilter === type
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {type || 'All Items'}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                    <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-none"
                    >
                        <option value="">All Languages</option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Hindi">Hindi</option>
                        {/* Add more as needed or fetch dynamically */}
                    </select>

                    <button
                        onClick={() =>
                            setAvailabilityFilter(prev =>
                                prev === 'available' ? '' : 'available'
                            )
                        }
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors flex-1 sm:flex-none text-center",
                            availabilityFilter === 'available'
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Available Only
                    </button>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading items...</div>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <Link key={item.id} to={`/catalog/${item.id}`}>
                            <Card className="hover:border-indigo-300 transition-colors">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                        <p className="text-sm text-gray-500 truncate">{item.author || item.type}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                                item.quantity_available > 0
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-gray-100 text-gray-600"
                                            )}>
                                                {item.quantity_available > 0 ? 'Available' : 'Out of Stock'}
                                            </span>
                                            {item.quantity_available > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {item.quantity_available} left
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No items found matching your search.</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Catalog;
