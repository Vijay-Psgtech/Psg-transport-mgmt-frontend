import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
     
    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
}
