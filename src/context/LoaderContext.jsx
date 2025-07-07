// src/context/LoaderContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import Loader from "@/components/common/Loader";

const LoaderContext = createContext({ show: () => { }, hide: () => { } });

export const LoaderProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const show = useCallback(() => setVisible(true), []);
    const hide = useCallback(() => setVisible(false), []);
    return (
        <LoaderContext.Provider value={{ show, hide }}>
            {children}
            {visible && <Loader variant="wave" />}
        </LoaderContext.Provider>
    );
};

export const useLoader = () => useContext(LoaderContext);
