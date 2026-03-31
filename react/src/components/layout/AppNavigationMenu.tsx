import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { matchPath, useLocation } from "react-router-dom";

interface AppNavigationMenuProps {
    navigateTo: (path: string) => void;
}

export default function AppNavigationMenu({ navigateTo }: AppNavigationMenuProps) {
    const subItemClassName = " ml-12"

    const location = useLocation();
    const currentPath = location.pathname;

    const accountRouteMatch = matchPath("/:accountId/*", currentPath);
    const accountId = accountRouteMatch?.params.accountId ?? "1";
    const isOnAccountDashboard = Boolean(matchPath("/:accountId/dashboard", currentPath));
    const isOnAccountBook = Boolean(matchPath("/:accountId/accountBook", currentPath));
    const isOnAccountChecks = Boolean(matchPath("/:accountId/accountChecks", currentPath));
    const isOnAccountBudget = Boolean(matchPath("/:accountId/budget", currentPath));

    const startItems: MenuItem[] = [
        {
            label: "Home",
            icon: "pi pi-home",
            className: currentPath === "/" ? "bg-surface-200" : undefined,
            command: () => navigateTo("/")
        },
        {
            label: "Comptes",
            items: [
                {
                    label: "Dashboard",
                    icon: "pi pi-chart-line",
                    className: subItemClassName + (isOnAccountDashboard ? " bg-surface-200" : ""),
                    command: () => navigateTo(`/${accountId}/dashboard`),
                },
                {
                    label: "Opérations",
                    icon: "pi pi-book",
                    className: subItemClassName + (isOnAccountBook ? " bg-surface-200" : ""),
                    command: () => navigateTo(`/${accountId}/accountBook`),
                },
                {
                    label: "Vérifications",
                    icon: "pi pi-check-square",
                    className: subItemClassName + (isOnAccountChecks ? " bg-surface-200" : ""),
                    command: () => navigateTo(`/${accountId}/accountChecks`)
                },
            ]
        },
        {
            label: "Budget",
            icon: "pi pi-calculator",
            className: isOnAccountBudget ? "bg-surface-200" : undefined,
            command: () => navigateTo(`/${accountId}/budget`)
        },
        {
            label: "Configuration",
            icon: "pi pi-cog",
            className: currentPath.startsWith("/setup") ? "bg-surface-200" : undefined,
            command: () => navigateTo("/setup")
        }
    ];

    const endItems: MenuItem[] = [
        {
            label: "Kanban",
            icon: "pi pi-th-large",
            className: currentPath.startsWith("/kanban") ? "bg-surface-200" : undefined,
            command: () => navigateTo("/kanban")
        },
    ]

    return (
        <div className="flex flex-col h-full">
            <Menu model={startItems} className="w-full border-0" />
            <div className="grow"></div>
            <Menu model={endItems} className="w-full border-0" />
        </div>
    )

}
