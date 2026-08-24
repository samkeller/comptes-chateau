import { ProgressSpinner } from "primereact/progressspinner";
import { Navigate, Outlet } from "react-router-dom";
import { useConnectedUser } from "../context/ConnectedUserContext";
import { routePaths } from "./routePaths";

export default function ProtectedLayout() {
    const { connectedUser, loading } = useConnectedUser();

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <ProgressSpinner />
            </div>
        );
    }

    if (!connectedUser) {
        return <Navigate to={routePaths.auth} replace />;
    }

    return <Outlet />;
}
