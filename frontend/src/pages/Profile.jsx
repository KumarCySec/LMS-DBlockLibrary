import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { User, LogOut, Shield } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        // Implement update logic here if backend supports it
        // For now just toggle off
        setIsEditing(false);
        alert("Profile update feature coming soon!");
    };

    if (!user) return null;

    return (
        <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

            <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold mb-4">
                        {user.name[0]}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-500">{user.roll_number}</p>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {user.roles.map(role => (
                            <span key={role} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 flex items-center">
                                <Shield className="w-3 h-3 mr-1" /> {role}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider ml-1">Personal Info</h3>
                    {/* <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel' : 'Edit'}
                    </Button> */}
                </div>
                <Card>
                    <CardContent className="p-0 divide-y divide-gray-100">
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-gray-600">Email</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-gray-600">Phone</span>
                            <span className="font-medium">{user.phone || 'N/A'}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-gray-600">Department</span>
                            <span className="font-medium">{user.department_id || 'N/A'}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-gray-600">Batch</span>
                            <span className="font-medium">{user.batch || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Button variant="danger" className="w-full" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
        </div>
    );
};

export default Profile;
