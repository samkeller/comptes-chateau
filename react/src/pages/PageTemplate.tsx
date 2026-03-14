import ChocoChou from "@assets/images/chocochou.png";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import { useGlobalToast } from "../components/GlobalToast";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import AppNavigationMenu from "../components/layout/AppNavigationMenu";
import UserConfigDialog from "../components/UserConfigDialog";

interface PageTemplateProps {
  pageTitle: string;
  children: ReactNode;
}

export function PageTemplate({ children, pageTitle }: PageTemplateProps) {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [isDesktopMenuVisible, setIsDesktopMenuVisible] = useState(true)
  const navigate = useNavigate();
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

  const brand = (
    <button className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo("/")}>
      <img src={ChocoChou} className="h-12" />
      <h1 className="text-2xl m-0 font-semibold">Chocosous</h1>
    </button>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {
        showConfigDialog &&
        <UserConfigDialog hideDialog={() => setShowConfigDialog(false)} />
      }
      <header className="flex items-center justify-between px-12 py-6 border-b border-surface">
        <div className="flex items-center gap-2">
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
        <div className="flex flex-row gap-2">
          <Button
            icon="pi pi-cog"
            text
            rounded
            size="small"
            tooltip="Réglages"
            onClick={() => setShowConfigDialog(true)}
          />
          <Button
            icon="pi pi-power-off"
            severity="danger"
            text
            rounded
            tooltip="Déconnexion"
            onClick={logout}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 md:flex overflow-hidden">
        {isDesktopMenuVisible && (
          <aside className="p-6 border-r border-surface hidden md:block md:w-64 h-full overflow-y-auto">
            <AppNavigationMenu navigateTo={navigateTo} />
          </aside>
        )}

        <Sidebar
          visible={isMobileMenuVisible}
          onHide={() => setIsMobileMenuVisible(false)}
          position="left"
          className="w-72"
        >
          <div className="flex flex-col h-full">
            <AppNavigationMenu navigateTo={navigateTo} />
          </div>
        </Sidebar>

        <main className="flex-1 min-h-0 overflow-y-auto px-12 py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 