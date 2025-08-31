import { useUser, useAuth } from "@clerk/clerk-react";
// import axios from "axios";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMealPrices } from "../queries/mealPrices";
import { LoaderProvider } from "./LoaderContext";

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const navigate = useNavigate();
    const { user, isLoaded } = useUser();

    const { getToken } = useAuth();

    const { data: mealPrices } = useMealPrices();

    // Determine if user has admin role
    const isAdmin = useMemo(() => {
        if (!isLoaded || !user) return false;
        
        const userRole = user?.publicMetadata?.role || 'user';
        const allowedRoles = ['admin', 'staff', 'superadmin'];
        
        return allowedRoles.includes(userRole);
    }, [user, isLoaded]);

    // Get user role
    const userRole = useMemo(() => {
        if (!isLoaded || !user) return 'user';
        return user?.publicMetadata?.role || 'user';
    }, [user, isLoaded]);

    const fetchUser = async () => {
        try {
            // const response = await api.get('/api/v1/clerk/test');
            // console.log('clerk test', response)

        } catch (error) {
            console.log('error', error);
        }
    }
    
    const value = {
        navigate, 
        user, 
        getToken, 
        isAdmin, 
        userRole,
        mealPrices
    }

    useEffect(() => {
        if (user) {
            fetchUser()
        }
    }, [user])
    
    return (
        <AppContext.Provider value={value}>
            <LoaderProvider>
                {children}
            </LoaderProvider>
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext);