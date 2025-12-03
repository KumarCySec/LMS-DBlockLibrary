import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { ShieldAlert } from 'lucide-react';

const AccessDenied = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <ShieldAlert className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 max-w-md mb-6">
                You don't have permission to view this page. Please contact the Admin if you believe this is a mistake.
            </p>
            <div className="flex gap-3">
                <Link to="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
            </div>
        </div>
    );
};

export default AccessDenied;
