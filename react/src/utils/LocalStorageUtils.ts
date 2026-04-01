import Account from "../interfaces/Account";

const ACCOUNTS_LIST_KEY = "cc.accounts.list";
const ACTIVE_ACCOUNT_ID_KEY = "cc.accounts.activeId";

function hasLocalStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseAccounts(input: unknown): Account[] {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .map((value) => new Account(value as Partial<Account>))
        .filter((account) => typeof account.id === "number" && Number.isInteger(account.id) && account.id > 0);
}

const LocalStorageUtils = {
    getAccounts(): Account[] {
        if (!hasLocalStorage()) {
            return [];
        }

        const rawValue = window.localStorage.getItem(ACCOUNTS_LIST_KEY);
        if (!rawValue) {
            return [];
        }

        try {
            return parseAccounts(JSON.parse(rawValue));
        } catch {
            return [];
        }
    },

    setAccounts(accounts: Account[]): void {
        if (!hasLocalStorage()) {
            return;
        }

        window.localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(accounts));
    },

    getActiveAccountId(): number | null {
        if (!hasLocalStorage()) {
            return null;
        }

        const rawValue = window.localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
        if (!rawValue) {
            return null;
        }

        const parsedId = Number(rawValue);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return null;
        }

        return parsedId;
    },

    setActiveAccountId(accountId: number): void {
        if (!hasLocalStorage()) {
            return;
        }

        window.localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, String(accountId));
    }
};

export default LocalStorageUtils;