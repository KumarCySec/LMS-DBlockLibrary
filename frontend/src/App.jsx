import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
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

import AddItem from './pages/admin/AddItem';
import AddDonor from './pages/admin/AddDonor';

const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
    const { user, loading, hasRole, hasPermission } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && !hasRole(requiredRole) && !hasRole('Admin')) {
        return <Navigate to="/" />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        // Use AccessDenied component logic here or render it directly
        // Since we want to show AccessDenied UI, we can return it.
        // But we need to import it.
        // Let's assume we import AccessDenied at the top.
        return <AccessDenied />;
    }

    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="catalog/:id" element={<ItemDetail />} />
                <Route path="my-borrowings" element={<MyBorrowings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />

                {/* Staff Routes */}
                <Route path="approvals" element={<ProtectedRoute requiredPermission="approve_checkout"><TransactionApprovals /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="admin" element={<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="admin/analytics" element={<ProtectedRoute requiredRole="Admin"><Analytics /></ProtectedRoute>} />
                <Route path="admin/inventory" element={<ProtectedRoute requiredRole="Incharge"><ManageInventory /></ProtectedRoute>} />
                <Route path="admin/inventory/add" element={<ProtectedRoute requiredRole="Incharge"><AddItem /></ProtectedRoute>} />
                <Route path="admin/users" element={<ProtectedRoute requiredRole="Admin"><ManageUsers /></ProtectedRoute>} />
                <Route path="admin/users/:userId" element={<ProtectedRoute requiredRole="Admin"><UserDetail /></ProtectedRoute>} />
                <Route path="admin/pending-approvals" element={<ProtectedRoute requiredRole="Incharge"><PendingApprovals /></ProtectedRoute>} />
                <Route path="admin/transactions" element={<ProtectedRoute requiredRole="Volunteer"><ManageTransactions /></ProtectedRoute>} />

                {/* New Admin Features */}
                <Route path="admin/settings" element={<ProtectedRoute requiredRole="Admin"><Settings /></ProtectedRoute>} />
                <Route path="admin/roles" element={<ProtectedRoute requiredRole="Admin"><ManageRoles /></ProtectedRoute>} />
                <Route path="admin/departments" element={<ProtectedRoute requiredRole="Admin"><ManageDepartments /></ProtectedRoute>} />
                <Route path="admin/roster" element={<ProtectedRoute requiredRole="Incharge"><ManageRoster /></ProtectedRoute>} />
                <Route path="admin/status" element={<ProtectedRoute requiredRole="Volunteer"><ManageStatus /></ProtectedRoute>} />
                <Route path="admin/donors" element={<ProtectedRoute requiredRole="Incharge"><ManageDonors /></ProtectedRoute>} />
                <Route path="admin/donors/add" element={<ProtectedRoute requiredRole="Incharge"><AddDonor /></ProtectedRoute>} />
                <Route path="admin/donors/:donorId" element={<ProtectedRoute requiredRole="Incharge"><DonorDetail /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default App;
