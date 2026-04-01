import { Outlet } from "react-router-dom";
import { useAccountId } from "../hooks/useAccountId";

/**
 * 
 * @returns 
 */
export default function AccountScopedOutlet() {
    const accountId = useAccountId();

    return <Outlet key={accountId} />;
}