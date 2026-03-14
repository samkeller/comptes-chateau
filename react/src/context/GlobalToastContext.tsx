import { Toast } from "primereact/toast";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { setGlobalToastHandler, showGlobalToast, type GlobalToastMessage } from "../services/GlobalToast";

interface GlobalToastProviderProps {
    children: ReactNode;
}

export function GlobalToastProvider({ children }: GlobalToastProviderProps) {
    const toastRef = useRef<Toast>(null);

    const toastHandler = useCallback((message: GlobalToastMessage) => {
        toastRef.current?.show({
            life: 3000,
            ...message,
        });
    }, []);

    useEffect(() => {
        setGlobalToastHandler(toastHandler);

        return () => {
            setGlobalToastHandler(null);
        };
    }, [toastHandler]);

    return (
        <>
            {children}
            <Toast ref={toastRef} position="bottom-right" />
        </>
    );
}

export function useGlobalToast(): (message: GlobalToastMessage) => void {
    return showGlobalToast;
}