import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Button } from "primereact/button";
import { useMemo, useRef } from "react";
import { matchPath, useLocation, useMatches } from "react-router-dom";
import Account from "../../interfaces/Account";
import { classNames } from "primereact/utils";

interface AppNavigationMenuProps {
    navigateTo: (path: string) => void;
    accounts: Account[];
    activeAccountId: number | null;
    onActiveAccountChange: (accountId: number) => void;
}

type NavKey =
    | "home"
    | "account-dashboard"
    | "account-book"
    | "account-checks"
    | "account-budget"
    | "setup"
    | "kanban";

interface NavHandle {
    navKey?: NavKey;
}

export default function AppNavigationMenu({
    navigateTo,
    accounts,
    activeAccountId,
    onActiveAccountChange
}: AppNavigationMenuProps) {

    const matches = useMatches();
    const location = useLocation();
    const accountSwitchMenuRef = useRef<Menu>(null);

    const activeNavKey = [...matches]
        .reverse()
        .map((match) => (match.handle as NavHandle | undefined)?.navKey)
        .find((navKey): navKey is NavKey => Boolean(navKey));

    const routeAccountId = [...matches]
        .reverse()
        .map((match) => match.params.accountId)
        .find((value): value is string => typeof value === "string" && /^\d+$/.test(value));

    const resolvedAccountId = activeAccountId ?? (routeAccountId ? Number(routeAccountId) : null) ?? accounts[0]?.id ?? null;

    const accountPath = (suffix: string): string => resolvedAccountId ? `/${resolvedAccountId}/${suffix}` : "/";
    const isOnAccountDashboard = activeNavKey === "account-dashboard";
    const isOnAccountBook = activeNavKey === "account-book";
    const isOnAccountChecks = activeNavKey === "account-checks";
    const isOnAccountBudget = activeNavKey === "account-budget";

    /**
     * Popup menu items for switching between accounts.
     */
    const accountsItems = useMemo<MenuItem[]>(() => {
        return accounts.map((account) => ({
            label: account.label,
            icon: account.id === resolvedAccountId ? "pi pi-check" : undefined,
            className: account.id === resolvedAccountId ? "bg-surface-200" : undefined,
            command: () => {
                onActiveAccountChange(account.id);

                const accountRouteMatch = matchPath("/:accountId/*", location.pathname);
                if (!accountRouteMatch?.params.accountId) {
                    return;
                }

                const suffix = accountRouteMatch.params["*"];
                navigateTo(suffix ? `/${account.id}/${suffix}` : `/${account.id}/dashboard`);
            }
        }));
    }, [accounts, resolvedAccountId, onActiveAccountChange, location.pathname, navigateTo]);

    const startItems: MenuItem[] = [
        {
            label: "Home",
            icon: "pi pi-home",
            className: activeNavKey === "home" ? "bg-surface-200" : undefined,
            command: () => navigateTo("/")
        },
        {
            separator: true
        },
        {
            template: (_item, options) => (
                <div
                    className={classNames(options.className, 'w-full flex flex-col hover:surface-400')}
                >
                    <div className="w-full flex items-center justify-between pl-4">
                        <div>
                            <span className="font-medium">{accounts.find(account => account.id === resolvedAccountId)?.label}</span>
                        </div>
                        <Button
                            icon="pi pi-arrow-right-arrow-left"
                            text
                            rounded
                            size="small"
                            type="button"
                            aria-label="Changer de compte"
                            tooltip="Changer de compte"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                accountSwitchMenuRef.current?.toggle(event);
                            }}
                        />
                    </div>
                    <div className="ml-4">
                        <Menu
                            className="border-0"
                            model={[
                                {
                                    label: "Dashboard",
                                    icon: "pi pi-chart-line",
                                    className: "font-bold " + (isOnAccountDashboard ? " bg-surface-200" : ""),
                                    command: () => navigateTo(accountPath("dashboard")),
                                },
                                {
                                    label: "Opérations",
                                    icon: "pi pi-book",
                                    className: (isOnAccountBook ? " bg-surface-200" : ""),
                                    command: () => navigateTo(accountPath("accountBook")),
                                },
                                {
                                    label: "Vérifications",
                                    icon: "pi pi-check-square",
                                    className: (isOnAccountChecks ? " bg-surface-200" : ""),
                                    command: () => navigateTo(accountPath("accountChecks"))
                                },
                                {
                                    label: "Budget",
                                    icon: "pi pi-calculator",
                                    className: isOnAccountBudget ? "bg-surface-200" : undefined,
                                    command: () => navigateTo(accountPath("budget"))
                                },
                                {
                                    label: "Automatisations",
                                    icon: "pi pi-android",
                                    className: isOnAccountBudget ? "bg-surface-200" : undefined,
                                    command: () => navigateTo(accountPath("automatisations"))
                                },
                            ]}

                        />
                    </div>
                </div>
            ),
        },
        {
            label: "Configuration",
            icon: "pi pi-cog",
            className: activeNavKey === "setup" ? "bg-surface-200" : undefined,
            command: () => navigateTo("/setup")
        }
    ];

    const endItems: MenuItem[] = [
        {
            label: "Kanban",
            icon: "pi pi-th-large",
            className: activeNavKey === "kanban" ? "bg-surface-200" : undefined,
            command: () => navigateTo("/kanban")
        },
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Popup */}
            <Menu ref={accountSwitchMenuRef} popup model={accountsItems} />
            {/* Menu */}
            <Menu model={startItems} className="w-full border-0" />
            <div className="grow"></div>
            <Menu model={endItems} className="w-full border-0" />
        </div>
    )

}
