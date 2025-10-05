import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/common/Loader';
import AdminNotFound from './AdminNotFound';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    // Show loader while checking authentication and role
    if (!isLoaded) {
        return <Loader />;
    }

    // If user is not logged in, show 404 (security: don't reveal protected routes exist)
    if (!user) {
        return <AdminNotFound />;
    }

    // Check if user has required role
    const userRole = user?.publicMetadata?.role || 'user';
    
    // If user doesn't have required role, show 404 (security: don't reveal protected routes exist)
    if (!allowedRoles.includes(userRole)) {
        return <AdminNotFound />;
    }

    // User is authenticated and has required role, render the protected content
    return <>{children}</>;
};

export default RoleBasedRoute;
