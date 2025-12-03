import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Bell, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
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
                                'flex flex-col items-center justify-center w-full h-full space-y-1',
                                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
