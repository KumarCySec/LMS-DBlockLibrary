import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import AccessDenied from './AccessDenied';

const RequirePermission = ({ children, perm }) => {
    const { user, loading, hasPermission, hasRole } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Admin always has access
    if (hasRole('Admin')) {
        return children;
    }

    if (perm && !hasPermission(perm)) {
        return <AccessDenied />;
    }

    return children;
};

export default RequirePermission;
