import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import UserService from "../services/UserService";
import { User } from "../interfaces/User";

interface ConnectedUserContextValue {
    connectedUser: User | null;
    loading: boolean;
    refreshUser: () => Promise<User>;
    clearUser: () => void;
}

const ConnectedUserContext = createContext<ConnectedUserContextValue | null>(null);

export function ConnectedUserProvider({ children }: { children: ReactNode }) {
    const [connectedUser, setConnectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const me = await new UserService().me();
        setConnectedUser(me);
        return me;
    }, []);

    const clearUser = useCallback(() => {
        setConnectedUser(null);
    }, []);

    useEffect(() => {
        refreshUser().finally(() => setLoading(false));
    }, [refreshUser]);

    return (
        <ConnectedUserContext.Provider value={{ connectedUser, loading, refreshUser, clearUser }}>
            {children}
        </ConnectedUserContext.Provider>
    );
}

export function useConnectedUser(): ConnectedUserContextValue {
    const ctx = useContext(ConnectedUserContext);
    if (!ctx) throw new Error("useConnectedUser must be used within ConnectedUserProvider");
    return ctx;
}
