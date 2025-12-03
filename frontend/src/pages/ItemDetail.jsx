import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const ActionButtons = ({ item, handleCheckout, handleJoinWaitlist, actionLoading }) => {
    // const { hasPermission } = useAuth(); 
    // Logic is simplified: Everyone sees Checkout if available. Backend handles permissions.

    if (item.quantity_available > 0) {
        return (
            <Button
                className="w-full h-12 text-lg shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleCheckout}
                isLoading={actionLoading}
            >
                Checkout Now
            </Button>
        );
    }

    return (
        <Button
            variant="secondary"
            className="w-full h-12 text-lg shadow-lg shadow-pink-200"
            onClick={handleJoinWaitlist}
            isLoading={actionLoading}
        >
            Join Waitlist
        </Button>
    );
};

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            const response = await api.get(`/inventory/${id}`);
            setItem(response.data);
        } catch (error) {
            console.error("Failed to fetch item", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        setActionLoading(true);
        setMessage(null);
        try {
            const response = await api.post('/transactions/request', { item_id: item.id });
            const { status, due_date } = response.data;

            if (status === 'ISSUED') {
                setMessage({ type: 'success', text: `Item Issued! Due: ${new Date(due_date).toLocaleDateString()}` });
            } else {
                setMessage({ type: 'success', text: 'Request sent! Waiting for approval.' });
            }
            // Refresh item data to update availability
            fetchItem();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to request checkout' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinWaitlist = async () => {
        setActionLoading(true);
        setMessage(null);
        try {
            await api.post('/common/waitlist', { item_id: item.id });
            setMessage({ type: 'success', text: 'Joined waitlist successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to join waitlist' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!item) return <div className="p-8 text-center">Item not found</div>;

    return (
        <div className="p-4 pb-24">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="space-y-6">
                <div>
                    <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">{item.type}</span>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">{item.title}</h1>
                    {item.author && <p className="text-gray-600 text-lg">{item.author}</p>}
                </div>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <span className="text-gray-500">Status</span>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium",
                                item.quantity_available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {item.quantity_available > 0 ? 'Available' : 'Out of Stock'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900">Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {item.language && (
                                    <div>
                                        <span className="block text-gray-500">Language</span>
                                        <span className="text-gray-900">{item.language}</span>
                                    </div>
                                )}
                                {item.model && (
                                    <div>
                                        <span className="block text-gray-500">Model</span>
                                        <span className="text-gray-900">{item.model}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="block text-gray-500">Donor</span>
                                    <span className="text-gray-900">{item.donor?.name || 'Anonymous'}</span>
                                </div>
                            </div>
                        </div>

                        {item.description && (
                            <div className="pt-2">
                                <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Area */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 max-w-md mx-auto">
                    {message && (
                        <div className={cn(
                            "mb-4 p-3 rounded-md text-sm flex items-center",
                            message.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                            {message.text}
                        </div>
                    )}

                    {/* Logic: 
                        - Student: Request Checkout (if available) or Join Waitlist
                        - Staff: View Requests (Link to approvals)
                    */}

                    {/* We need to check roles here. Assuming we can get user from context or api */}
                    {/* For now, let's just show Request Checkout if it's a student-like flow, 
                        but ideally we check `user.roles`. 
                        Let's import useAuth to check roles. */}

                    <ActionButtons
                        item={item}
                        handleCheckout={handleCheckout}
                        handleJoinWaitlist={handleJoinWaitlist}
                        actionLoading={actionLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
