import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { useLocation } from "react-router-dom";

interface AppNavigationMenuProps {
    navigateTo: (path: string) => void;
}

export default function AppNavigationMenu({ navigateTo }: AppNavigationMenuProps) {
    const subItemClassName = " ml-12"

    const location = useLocation();
    const currentPath = location.pathname;

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
                    label: "Opérations",
                    icon: "pi pi-book",
                    className: subItemClassName + (
                        currentPath === "/comptes" || currentPath === "/comptes/" ?
                            " bg-surface-200" :
                            ""
                    ),
                    command: () => navigateTo("/comptes"),
                },
                {
                    label: "Vérifications",
                    icon: "pi pi-check-square",
                    className: subItemClassName + (currentPath.startsWith("/comptes/verifications") ? " bg-surface-200" : ""),
                    command: () => navigateTo("/comptes/verifications")
                },
            ]
        },
        {
            label: "Budget",
            icon: "pi pi-calculator",
            className: currentPath.startsWith("/budget") ? "bg-surface-200" : undefined,
            command: () => navigateTo("/budget")
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
