import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const navigate = useNavigate();
    const { user } = useUser();

    const { getToken } = useAuth();

    const [isAdmin, setIsAdmin] = useState(false);

    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/v1/clerk/test', { headers: { Authorization: `Bearer ${await getToken()}` } })

            console.log(response);

        } catch (error) {
            console.log('error', error);
        }
    }
    const value = {
        navigate, user, getToken, isAdmin, axios
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