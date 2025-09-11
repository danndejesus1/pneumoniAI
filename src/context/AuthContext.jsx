import React, {createContext, useContext, useEffect, useState} from 'react';
import {onAuthStateChanged, signOut as firebaseSignOut} from 'firebase/auth';
import {auth} from '../firebase';

const AuthContext = createContext({
    user: null,
    loading: true,
    signOut: () => Promise.resolve(),
});

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signOut = () => {
        setLoading(true);
        return firebaseSignOut(auth)
            .then(() => {
                setUser(null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    return (
        <AuthContext.Provider value={{user, loading, signOut}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
