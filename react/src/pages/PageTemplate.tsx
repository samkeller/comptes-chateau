import ChocoChou from "@assets/images/chocochou.png";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Account from "../interfaces/Account";
import AuthService from "../services/AuthService";
import AccountService from "../services/AccountService";
import { useGlobalToast } from "../context/GlobalToastContext";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import AppNavigationMenu from "../components/layout/AppNavigationMenu";
import UserConfigDialog from "../components/UserConfigDialog";
import { useConnectedUser } from "../context/ConnectedUserContext";
import LocalStorageUtils from "../utils/LocalStorageUtils";
import ChangelogDialog from "@/components/ChangelogDialog";

const localStorageUtils = new LocalStorageUtils();

interface PageTemplateProps {
  pageTitle: string;
  children: ReactNode;
}

export function PageTemplate({ children, pageTitle }: PageTemplateProps) {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [isDesktopMenuVisible, setIsDesktopMenuVisible] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const navigate = useNavigate();
  const showGlobalToast = useGlobalToast();
  const { clearUser } = useConnectedUser();

  const isXS = window.innerWidth < 640; // Tailwind's xs breakpoint

  useEffect(() => {
    document.title = pageTitle + " - Chocosous";
  }, [pageTitle])

  useEffect(() => {
    new AccountService().getAllAccounts().then((fetchedAccounts) => {
      const storedId = localStorageUtils.getActiveAccountId();
      const resolvedId = storedId ?? fetchedAccounts[0]?.id ?? null;
      if (resolvedId === null) {
        throw new Error("No accounts available for the user.");
      }

      localStorageUtils.setActiveAccountId(resolvedId);
      setAccounts(fetchedAccounts);
      setActiveAccountId(resolvedId);
    });
  }, []);

  const logout = async () => {
    await new AuthService().logout();
    clearUser();
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

  const handleActiveAccountChange = (accountId: number) => {
    localStorageUtils.setActiveAccountId(accountId);
    setActiveAccountId(accountId);
  }

  const brand = (
    <button className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo("/")}>
      <img src={ChocoChou} className="h-12" />
      <h1 className="text-xl md:text-2xl m-0 font-semibold1 md:break-all whitespace-nowrap overflow-hidden">
        {
          isXS ?
            `${activeAccountId && accounts.find(account => account.id === activeAccountId)?.label}` :
            `Chocosous ${activeAccountId && `- ${accounts.find(account => account.id === activeAccountId)?.label}`}`
        }
      </h1>
    </button>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {
        showConfigDialog &&
        <UserConfigDialog hideDialog={() => setShowConfigDialog(false)} />
      }
      {
        showChangelogDialog &&
        <ChangelogDialog hideDialog={() => setShowChangelogDialog(false)} />
      }
      <header className="flex items-center justify-between px-4 md:px-12 py-4 md:py-6 border-b border-surface">
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
        <div className="flex flex-row gap-1">
          <Button
            icon="pi pi-cog"
            text
            rounded
            size="small"
            tooltip="Réglages"
            onClick={() => setShowConfigDialog(true)}
            {...isXS && { className: "p-1 w-6 h-6" }}
          />
            <Button
              icon="pi pi-history"
              text
              rounded
              size="small"
              tooltip="Changelog"
              onClick={() => setShowChangelogDialog(true)}
              {...isXS && { className: "p-1 w-6 h-6" }}
            />
          <Button
            icon="pi pi-power-off"
            severity="danger"
            text
            rounded
            tooltip="Déconnexion"
            onClick={logout}
            {...isXS && { className: "p-1 w-6 h-6" }}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {isDesktopMenuVisible && (
          <aside className="p-6 border-r border-surface hidden md:block md:w-64 h-full overflow-y-auto">
            <AppNavigationMenu
              navigateTo={navigateTo}
              accounts={accounts}
              activeAccountId={activeAccountId}
              onActiveAccountChange={handleActiveAccountChange}
            />
          </aside>
        )}

        <Sidebar
          visible={isMobileMenuVisible}
          onHide={() => setIsMobileMenuVisible(false)}
          position="left"
          className="w-full max-w-xs"
          style={{ width: "100%", maxWidth: "20rem" }}
        >
          <div className="flex flex-col h-full">
            <AppNavigationMenu
              navigateTo={navigateTo}
              accounts={accounts}
              activeAccountId={activeAccountId}
              onActiveAccountChange={handleActiveAccountChange}
            />
          </div>
        </Sidebar>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 md:px-12 py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 