import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg relative">
                <Outlet />
            </main>
            {user && <BottomNav />}
        </div>
    );
};

export default Layout;
