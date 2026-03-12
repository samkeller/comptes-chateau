import { Button } from "primereact/button";
import { Card } from "primereact/card";
import ChocoChou from "@assets/images/chocochou.png";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <Card className="w-full sm:w-[30rem] text-center">
        <img
          src={ChocoChou}
          alt="Chat triste"
          className="w-full rounded-border mb-6"
          style={{ maxHeight: 260, objectFit: "cover" }}
        />

        <h2 className="m-0 mb-2">404</h2>
        <p className="text-surface-600 mb-12">
          Cette page n'existe pas. Le chat est déçu.
        </p>

        <Button
          label="Retour à l’accueil"
          icon="pi pi-home"
          onClick={() => navigate("/")}
        />
      </Card>
    </div>
  );
}
