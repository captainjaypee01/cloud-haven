// src/hooks/useApi.ts
import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';          // Hook is legal here
import axios from 'axios';

export function useApi() {
    const { getToken, signOut } = useAuth();             // ← now legal
    
    return useMemo(() => {
        const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const instance = axios.create({ baseURL });

        instance.interceptors.request.use(async (config) => {

            if (config?.requiresAuth) {
                const token = await getToken();
                if (token) config.headers.Authorization = `Bearer ${token}`;
            }
            delete config.requiresAuth;
            return config;
        });

        instance.interceptors.response.use(
            r => r,
            err => {
                // if (err.response?.status === 401) signOut();
                return Promise.reject(err);
            },
        );
        return instance;
    }, [getToken, signOut]);                             // recreate if funcs change
}
