import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { useLocation } from "react-router-dom";

interface AppNavigationMenuProps {
    navigateTo: (path: string) => void;
}

export default function AppNavigationMenu({ navigateTo }: AppNavigationMenuProps) {
    const subItemClassName = " ml-4"

    const location = useLocation();
    const currentPath = location.pathname;

    const items: MenuItem[] = [
        {
            label: "Home",
            icon: "pi pi-home",
            className: currentPath === "/" ? "surface-200" : undefined,
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
                            " surface-200" :
                            ""
                    ),
                    command: () => navigateTo("/comptes"),
                },
                {
                    label: "Vérifications",
                    icon: "pi pi-check-square",
                    className: subItemClassName + (currentPath.startsWith("/comptes/verifications") ? " surface-200" : ""),
                    command: () => navigateTo("/comptes/verifications")
                },
            ]
        },
        {
            label: "Budget",
            icon: "pi pi-calculator",
            className: currentPath.startsWith("/budget") ? "surface-200" : undefined,
            command: () => navigateTo("/budget")
        },
        {
            label: "Configuration",
            icon: "pi pi-cog",
            className: currentPath.startsWith("/setup") ? "surface-200" : undefined,
            command: () => navigateTo("/setup")
        }
    ];

    return <Menu model={items} className="w-full border-none" />;
}
