import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/common/Loader';

const ProtectedAdminRoute = ({ children }) => {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded) {
            // If user is not logged in, redirect to homepage
            if (!user) {
                navigate('/');
                return;
            }

            // Check if user has admin role
            const userRole = user?.publicMetadata?.role || 'user';
            const allowedRoles = ['admin', 'staff', 'superadmin'];
            
            if (!allowedRoles.includes(userRole)) {
                // User doesn't have admin privileges, redirect to homepage
                navigate('/');
                return;
            }
        }
    }, [user, isLoaded, navigate]);

    // Show loader while checking authentication and role
    if (!isLoaded) {
        return <Loader />;
    }

    // If user is not logged in or doesn't have admin role, don't render children
    if (!user) {
        return null;
    }

    const userRole = user?.publicMetadata?.role || 'user';
    const allowedRoles = ['admin', 'staff', 'superadmin'];
    
    if (!allowedRoles.includes(userRole)) {
        return null;
    }

    // User is authenticated and has admin role, render the protected content
    return <>{children}</>;
};

export default ProtectedAdminRoute;
