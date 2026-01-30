import ChocoChou from "@assets/images/chocochou.png";
import { Button } from "primereact/button";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

export function PageTemplate({ children }: { children: ReactNode }) {
  const [authService] = useState(new AuthService()) 
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="p-4">
      <div
        className="flex mb-4"
      >
        <div className="flex align-items-center">
          <img src={ChocoChou} className="h-2rem" />
          <h1 className="text-4xl m-0" >Chocosous</h1>
        </div>
        <div className="flex-grow-1"></div>
        <div>
          <Button
            icon="pi pi-power-off"
            size="large"
            rounded text
            tooltip="Déconnexion"
            className="m-0"
            severity="danger"
            aria-label="logout"
            onClick={() => logout()}
          />
        </div>

      </div>
      {children}
    </div>
  );
} 