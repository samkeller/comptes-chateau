import { Toast } from "primereact/toast";
import type { ToastMessage } from "primereact/toast";
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

export type GlobalToastMessage = Pick<
    ToastMessage,
    "severity" | "summary" | "detail" | "life"
>;

interface GlobalToastContextValue {
    showGlobalToast: (message: GlobalToastMessage) => void;
}

const GlobalToastContext = createContext<GlobalToastContextValue | null>(null);

interface GlobalToastProviderProps {
    children: ReactNode;
}

export function GlobalToastProvider({ children }: GlobalToastProviderProps) {
    const toastRef = useRef<Toast>(null);

    const showGlobalToast = useCallback((message: GlobalToastMessage) => {
        toastRef.current?.show({
            life: 3000,
            ...message,
        });
    }, []);

    const contextValue = useMemo<GlobalToastContextValue>(() => ({
        showGlobalToast,
    }), [showGlobalToast]);

    return (
        <GlobalToastContext.Provider value={contextValue}>
            {children}
            <Toast ref={toastRef} position="bottom-right" />
        </GlobalToastContext.Provider>
    );
}

export function useGlobalToast(): GlobalToastContextValue["showGlobalToast"] {
    const context = useContext(GlobalToastContext);

    if (!context) {
        throw new Error("useGlobalToast must be used within GlobalToastProvider");
    }

    return context.showGlobalToast;
}