import ChocoChou from "@assets/images/chocochou.png";
import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import { MenuItem } from "primereact/menuitem";
import { Menu } from "primereact/menu";
import { useGlobalToast } from "../components/GlobalToast";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";

interface PageTemplateProps {
  pageTitle: string;
  children: ReactNode;
}

export function PageTemplate({ children, pageTitle }: PageTemplateProps) {
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [isDesktopMenuVisible, setIsDesktopMenuVisible] = useState(true)
  const navigate = useNavigate();
  const location = useLocation();
  const showGlobalToast = useGlobalToast();

  useEffect(() => {
    document.title = pageTitle + " - Chocosous";
  }, [pageTitle])

  const logout = async () => {
    await new AuthService().logout();
    navigate("/auth", { replace: true });
    showGlobalToast({
      severity: "info",
      detail: "Déconnexion réussie ! 👋",
    })
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMobileMenuVisible(false);
  }

  const navigationItems: MenuItem[] = [
    {
      label: "Home",
      icon: "pi pi-home",
      className: location.pathname === "/" ? "surface-200" : undefined,
      command: () => navigateTo("/"),
    },
    {
      label: "Comptes",
      icon: "pi pi-book",
      className: location.pathname.startsWith("/comptes") ? "surface-200" : undefined,
      command: () => navigateTo("/comptes"),
    },
    {
      label: "Budget",
      icon: "pi pi-calculator",
      className: location.pathname.startsWith("/budget") ? "surface-200" : undefined,
      command: () => navigateTo("/budget"),
    },
    {
      label: "Données",
      icon: "pi pi-database",
      className: location.pathname.startsWith("/datas") ? "surface-200" : undefined,
      command: () => navigateTo("/datas"),
    },
    {
      label: "Configuration",
      icon: "pi pi-cog",
      className: location.pathname.startsWith("/setup") ? "surface-200" : undefined,
      command: () => navigateTo("/setup"),
    },
  ]

  const brand = (
    <button className="flex align-items-center gap-2 border-none bg-transparent p-0 text-left color-inherit cursor-pointer" onClick={() => navigateTo("/")}> 
      <img src={ChocoChou} className="h-3rem" />
      <h1 className="text-2xl m-0">Chocosous</h1>
    </button>
  )

  return (
    <div className="h-screen flex flex-column overflow-hidden">
      <header className="flex align-items-center justify-content-between px-4 py-3 border-bottom-1 surface-border">
        <div className="flex align-items-center gap-2">
          <div className="md:hidden">
            <Button
              icon="pi pi-bars"
              text
              rounded
              aria-label="Ouvrir le menu"
              onClick={() => setIsMobileMenuVisible(true)}
            />
          </div>
          <div className="hidden md:block">
            <Button
              icon="pi pi-bars"
              text
              rounded
              aria-label={isDesktopMenuVisible ? "Masquer le menu" : "Afficher le menu"}
              onClick={() => setIsDesktopMenuVisible((prev) => !prev)}
            />
          </div>
          {brand}
        </div>
        <Button
          icon="pi pi-power-off"
          severity="danger"
          text
          onClick={logout}
        />
      </header>

      <div className="flex-1 min-h-0 md:flex overflow-hidden">
        {isDesktopMenuVisible && (
          <aside className="p-3 border-right-1 surface-border hidden md:block md:w-18rem h-full overflow-y-auto">
            <Menu model={navigationItems} className="w-full border-none" />
          </aside>
        )}

        <Sidebar
          visible={isMobileMenuVisible}
          onHide={() => setIsMobileMenuVisible(false)}
          position="left"
          className="w-18rem"
        >
          <div className="flex flex-column h-full">
            <Menu model={navigationItems} className="w-full border-none" />
          </div>
        </Sidebar>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {children}
        </main>
      </div>
    </div>
  );
} 