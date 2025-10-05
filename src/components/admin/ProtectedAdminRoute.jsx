import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/common/Loader';
import AdminNotFound from './AdminNotFound';

const ProtectedAdminRoute = ({ children }) => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    // Show loader while checking authentication and role
    if (!isLoaded) {
        return <Loader />;
    }

    // If user is not logged in, show 404 (security: don't reveal admin routes exist)
    if (!user) {
        return <AdminNotFound />;
    }

    // Check if user has admin role
    const userRole = user?.publicMetadata?.role || 'user';
    const allowedRoles = ['admin', 'staff', 'superadmin'];
    
    // If user doesn't have admin privileges, show 404 (security: don't reveal admin routes exist)
    if (!allowedRoles.includes(userRole)) {
        return <AdminNotFound />;
    }

    // User is authenticated and has admin role, render the protected content
    return <>{children}</>;
};

export default ProtectedAdminRoute;
