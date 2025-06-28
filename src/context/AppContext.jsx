import { useUser, useAuth } from "@clerk/clerk-react";
// import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { useMealPrices } from "../queries/mealPrices";

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const navigate = useNavigate();
    const { user } = useUser();

    const { getToken } = useAuth();

    const [isAdmin, setIsAdmin] = useState(false);
    const api = useApi();
    const { data: mealPrices, isLoading } = useMealPrices();

    const fetchUser = async () => {
        try {
            // const response = await api.get('/api/v1/rooms');

        } catch (error) {
            console.log('error', error);
        }
    }
    const value = {
        navigate, user, getToken, isAdmin, mealPrices
    }

    useEffect(() => {
        if (user) {
            fetchUser()
        }
    }, [user])
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext);