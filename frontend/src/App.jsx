import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import AccessDenied from './components/AccessDenied';

import Home from './pages/Home';

import Catalog from './pages/Catalog';
import ItemDetail from './pages/ItemDetail';

import MyBorrowings from './pages/MyBorrowings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageInventory from './pages/admin/ManageInventory';
import ManageUsers from './pages/admin/ManageUsers';
import ManageTransactions from './pages/admin/ManageTransactions';
import PendingApprovals from './pages/admin/PendingApprovals';
import Settings from './pages/admin/Settings';
import ManageRoles from './pages/admin/ManageRoles';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageRoster from './pages/admin/ManageRoster';
import ManageStatus from './pages/admin/ManageStatus';
import UserDetail from './pages/admin/UserDetail';
import TransactionApprovals from './pages/common/TransactionApprovals';

import ManageDonors from './pages/admin/ManageDonors';
import DonorDetail from './pages/admin/DonorDetail';
import Analytics from './pages/admin/Analytics';
import VolunteerAnalytics from './pages/admin/VolunteerAnalytics';

import AddItem from './pages/admin/AddItem';
import AddDonor from './pages/admin/AddDonor';
import ImportData from './pages/admin/ImportData';
import Attendance from './pages/Attendance';
import Announcements from './pages/admin/Announcements';
import ActivityLog from './pages/admin/ActivityLog';
import CurrentOutstanding from './pages/admin/CurrentOutstanding';
import Payments from './pages/Payments';

const ProtectedRoute = ({ children, requiredRole, requiredPermission, requiredAnyPermission }) => {
    const { user, loading, error, hasRole, hasPermission } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md">
                    <h3 className="font-bold text-lg mb-2">Connection Error</h3>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && !hasRole(requiredRole) && !hasRole('Admin')) {
        return <Navigate to="/" />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <AccessDenied />;
    }

    if (requiredAnyPermission && !requiredAnyPermission.some(perm => hasPermission(perm))) {
        return <AccessDenied />;
    }

    return children;
};

import ScrollToTop from './components/ScrollToTop';

function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Home />} />
                    <Route path="catalog" element={<Catalog />} />
                    <Route path="catalog/:id" element={<ItemDetail />} />
                    <Route path="my-borrowings" element={<MyBorrowings />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="donors/:donorId" element={<ProtectedRoute><DonorDetail /></ProtectedRoute>} />

                    {/* Staff Routes */}
                    <Route path="approvals" element={
                        <ProtectedRoute requiredAnyPermission={['approve_checkout', 'approve_return', 'approve_renew']}>
                            <TransactionApprovals />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="admin" element={<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="admin/analytics" element={<ProtectedRoute requiredPermission="view_analytics"><Analytics /></ProtectedRoute>} />
                    <Route path="admin/volunteer-analytics" element={<ProtectedRoute requiredPermission="view_analytics"><VolunteerAnalytics /></ProtectedRoute>} />

                    <Route path="admin/inventory" element={<ProtectedRoute requiredPermission="manage_inventory"><ManageInventory /></ProtectedRoute>} />
                    <Route path="admin/inventory/add" element={<ProtectedRoute requiredPermission="manage_inventory"><AddItem /></ProtectedRoute>} />

                    <Route path="admin/users" element={<ProtectedRoute requiredPermission="manage_users"><ManageUsers /></ProtectedRoute>} />
                    <Route path="admin/users/:userId" element={<ProtectedRoute requiredPermission="manage_users"><UserDetail /></ProtectedRoute>} />
                    <Route path="admin/pending-approvals" element={<ProtectedRoute requiredPermission="approve_users"><PendingApprovals /></ProtectedRoute>} />

                    <Route path="admin/transactions" element={<ProtectedRoute requiredPermission="approve_checkout"><ManageTransactions /></ProtectedRoute>} />

                    {/* New Admin Features */}
                    <Route path="admin/settings" element={<ProtectedRoute requiredPermission="manage_settings"><Settings /></ProtectedRoute>} />
                    <Route path="admin/roles" element={<ProtectedRoute requiredPermission="manage_roles_permissions"><ManageRoles /></ProtectedRoute>} />
                    <Route path="admin/departments" element={<ProtectedRoute requiredPermission="manage_departments"><ManageDepartments /></ProtectedRoute>} />
                    <Route path="admin/roster" element={<ProtectedRoute requiredPermission="manage_roster"><ManageRoster /></ProtectedRoute>} />
                    <Route path="admin/status" element={<ProtectedRoute requiredPermission="update_library_status"><ManageStatus /></ProtectedRoute>} />

                    <Route path="admin/donors" element={<ProtectedRoute requiredPermission="manage_donors"><ManageDonors /></ProtectedRoute>} />
                    <Route path="admin/donors/add" element={<ProtectedRoute requiredPermission="manage_donors"><AddDonor /></ProtectedRoute>} />
                    <Route path="admin/donors/:donorId" element={<ProtectedRoute requiredPermission="manage_donors"><DonorDetail /></ProtectedRoute>} />



                    <Route path="admin/import" element={<ProtectedRoute requiredPermission="import_data"><ImportData /></ProtectedRoute>} />

                    <Route path="admin/announcements" element={<ProtectedRoute requiredPermission="manage_settings"><Announcements /></ProtectedRoute>} />
                    <Route path="admin/activity" element={<ProtectedRoute requiredPermission="view_analytics"><ActivityLog /></ProtectedRoute>} />
                    <Route path="admin/inventory/outstanding" element={<ProtectedRoute requiredPermission="view_analytics"><CurrentOutstanding /></ProtectedRoute>} />

                    {/* Attendance */}
                    <Route path="attendance" element={<ProtectedRoute requiredAnyPermission={['manage_roster', 'view_analytics', 'update_library_status']}><Attendance /></ProtectedRoute>} />

                    <Route path="payments" element={<Payments />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
