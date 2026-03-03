import ChocoChou from "@assets/images/chocochou.png";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";
import { MenuItem } from "primereact/menuitem";
import { MegaMenu } from "primereact/megamenu";
import { useGlobalToast } from "../components/GlobalToast";

interface PageTemplateProps {
  pageTitle: string;
  children: ReactNode;
}

export function PageTemplate({ children, pageTitle }: PageTemplateProps) {
  const [authService] = useState(new AuthService())
  const navigate = useNavigate();
  const showGlobalToast = useGlobalToast();

  useEffect(() => {
    document.title = pageTitle + " - Chocosous";
  }, [pageTitle])

  const logout = async () => {
    await authService.logout();
    navigate("/auth", { replace: true });
    showGlobalToast({
      severity: "info",
      detail: "Déconnexion réussie ! 👋",
    })
  };

  const menuItemsStart: MenuItem[] = [
    {
      template: () => (
        <div className="flex align-items-center px-2 cursor-pointer">
          <img src={ChocoChou} className="h-2rem" />
          <h1 className="text-4xl m-0" >Chocosous</h1>
        </div>
      ),
      command: () => navigate("/"),
    },
    {
      icon: <i className="pi pi-home" />,
      command: () => navigate("/"),
    },
    {
      icon: <i className="pi pi-calculator" />,
      command: () => navigate("/budget"),
    },
    {
      // Séparateur.
      disabled: true,
      className: "flex-grow-1"
    },
    {
      icon: <i className="pi pi-power-off text-red-500" />,
      command: () => logout(),
    }
  ]


  return (
    <div className="px-4 py-2">
      <MegaMenu
        model={menuItemsStart}
        className="border-none"
        pt={{ menu: { className: "w-full" } }}
      />
      {children}
    </div>
  );
} 