import Account from "../interfaces/Account";

const LOCAL_STORAGE_KEYS = {
    ACCOUNTS_LIST: "cc.accounts.list",
    ACTIVE_ACCOUNT_ID: "cc.accounts.activeId"
}

interface WithExpiry {
    value: string;
    timestamp: number;
}
class LocalStorageUtils {
    private expiresAfterMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    constructor() {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            throw new Error("LocalStorageUtils can only be used in a browser environment with localStorage support.");
        }
    }


    getAccounts(): Account[] {
        const rawValue = this.getWithExpiry(LOCAL_STORAGE_KEYS.ACCOUNTS_LIST);
        if (rawValue === null) {
            return []
        }
        return JSON.parse(rawValue)
            .map((value: Partial<Account>) => new Account(value));
    }

    setAccounts(accounts: Account[]): void {
        this.setWithExpiry(LOCAL_STORAGE_KEYS.ACCOUNTS_LIST, JSON.stringify(accounts));
    }

    getActiveAccountId(): number | null {
        const rawValue = this.getWithExpiry(LOCAL_STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
        if (!rawValue) {
            return null;
        }
        const parsedId = Number(rawValue);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return null;
        }
        return parsedId;
    }

    setActiveAccountId(accountId: number): void {
        this.setWithExpiry(LOCAL_STORAGE_KEYS.ACTIVE_ACCOUNT_ID, String(accountId));
    }

    private setWithExpiry(key: string, value: string): void {
        const record: WithExpiry = {
            value,
            timestamp: Date.now()
        };
        window.localStorage.setItem(key, JSON.stringify(record));
    }

    private getWithExpiry(key: string): string | null {
        const rawRecord = window.localStorage.getItem(key);
        if (!rawRecord) {
            return null;
        }
        const parsed: WithExpiry = JSON.parse(rawRecord);

        if (Date.now() - parsed.timestamp > this.expiresAfterMs) {
            window.localStorage.removeItem(key);
            return null;
        }
        return parsed.value;
    }
};

export default LocalStorageUtils;
export { LOCAL_STORAGE_KEYS };