import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

import RequestOpen from '../RequestOpen';
import ScrollToTop from '../ui/ScrollToTop';
import NotificationPoller from '../NotificationPoller';

const Layout = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = React.useState(0);

    return (
        <div className="min-h-screen bg-gray-50 md:flex">
            <NotificationPoller onUpdate={setUnreadCount} />

            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed h-full w-64 z-30">
                {user && <Sidebar unreadCount={unreadCount} />}
            </div>

            {/* Main Content Wrapper */}
            <main className="flex-1 min-h-screen relative w-full md:pl-64">
                {/* Mobile Container (Card style) VS Desktop Container (Full width) */}
                <div className="w-full min-h-screen bg-white shadow-lg md:shadow-none md:bg-gray-50 mx-auto max-w-md md:max-w-7xl md:p-6 pb-32 md:pb-10">
                    <Outlet />
                </div>
            </main>

            <ScrollToTop />
            <RequestOpen />

            {/* Mobile Bottom Nav */}
            <div className="md:hidden">
                {user && <BottomNav unreadCount={unreadCount} />}
            </div>
        </div>
    );
};

export default Layout;
