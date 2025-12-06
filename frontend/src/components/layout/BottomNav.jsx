import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Bell, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

const BottomNav = ({ unreadCount = 0 }) => {
    const location = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: BookOpen, label: 'Catalog', path: '/catalog' },
        { icon: ShoppingBag, label: 'My Books', path: '/my-borrowings' },
        { icon: Bell, label: 'Alerts', path: '/notifications' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    // Example of permission-based filtering if needed in BottomNav
    // For now, these are basic links available to most. 
    // If we wanted to hide Catalog for some reason:
    // if (!hasPermission(user, 'view_catalog')) { ... }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full space-y-1 relative',
                                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <div className="relative">
                                <Icon className="w-6 h-6" />
                                {item.label === 'Alerts' && unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
