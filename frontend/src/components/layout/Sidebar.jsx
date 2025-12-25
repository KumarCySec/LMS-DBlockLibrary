import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

const Sidebar = ({ unreadCount = 0 }) => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
            navigate('/login');
        }
    };

    const navItems = [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: BookOpen, label: 'Library Catalog', path: '/catalog' },
        { icon: ShoppingBag, label: 'My Borrowings', path: '/my-borrowings' },
        { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
        { icon: User, label: 'My Profile', path: '/profile' },
    ];

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200 w-64 shadow-sm">
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-indigo-200 shadow-lg">
                    L
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight">LMS Portal</h1>
                    <p className="text-xs text-gray-500 font-medium">D-Block Library</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <div className="mb-6">
                    <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                                <span className="absolute right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Admin Link Special */}
                {(hasRole('Admin') || hasRole('Incharge') || hasRole('Volunteer')) && (
                    <div className="mb-6">
                        <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Management</p>
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-amber-50 text-amber-700 font-bold shadow-sm"
                                    : "text-gray-600 hover:bg-amber-50/50 hover:text-gray-900 font-medium"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Admin Panel</span>
                        </NavLink>
                    </div>
                )}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
