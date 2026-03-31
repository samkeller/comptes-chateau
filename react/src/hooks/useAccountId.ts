import { useParams } from "react-router-dom";

/**
 * Hook to safely extract accountId from URL params.
 * Returns the accountId as a number, or throws if invalid.
 * 
 * Usage: const accountId = useAccountId();
 */
export function useAccountId(): number {
    const { accountId } = useParams<{ accountId: string }>();
    
    if (!accountId) {
        throw new Error("useAccountId: accountId not found in URL params. Ensure routes use /:accountId prefix.");
    }
    
    const id = parseInt(accountId, 10);
    
    if (isNaN(id) || id <= 0) {
        throw new Error(`useAccountId: Invalid accountId "${accountId}". Must be a positive integer.`);
    }
    
    return id;
}
