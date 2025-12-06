import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

import RequestOpen from '../RequestOpen';
import ScrollToTop from '../ui/ScrollToTop';
import NotificationPoller from '../NotificationPoller';

const Layout = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = React.useState(0);

    return (
        <div className="min-h-screen bg-gray-50 pb-32"> {/* Increased padding to prevent overlap */}
            <NotificationPoller onUpdate={setUnreadCount} />
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg relative">
                <Outlet />
            </main>
            <ScrollToTop />
            <RequestOpen />
            {user && <BottomNav unreadCount={unreadCount} />}
        </div>
    );
};

export default Layout;
