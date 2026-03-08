import { useEffect, useState } from "react";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import ChocoChou from "@assets/images/chocochou.png";
import { useGlobalToast } from "../components/GlobalToast";

export default function AuthPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authService] = useState(new AuthService());
    let navigate = useNavigate();
    const showGlobalToast = useGlobalToast();

    useEffect(() => { setError(null) }, [username, password])

    const submit = async () => {
        setLoading(true);
        setError(null);

        try {
            await authService.login(username, password);
            showGlobalToast({
                severity: "success",
                detail: "Connexion réussie ! 😽",
            });
            navigate("/");
        } catch {
            setError("Identifiants incorrects");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex align-items-center justify-content-center min-h-screen">
            <Card
                header={
                    <div className="text-center">
                        <img
                            src={ChocoChou}
                            alt="Chat triste"
                            className="w-full border-round mb-3"
                            style={{ maxHeight: 260, objectFit: "cover" }}
                        />
                    </div>
                }
                title="Passer la choco-sécurité"
                className="w-full sm:w-30rem"
            >
                <div className="flex flex-column gap-3">
                    <div className="p-fluid">
                        <InputText
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            placeholder="Nom d'utilisateur"
                            autoComplete="username"
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                        />
                    </div>
                    <div className="flex-grow-1 p-fluid">
                        <Password
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            feedback={false}
                            toggleMask
                            placeholder="Mot de passe"
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                        />
                    </div>
                    <Button
                        icon="pi pi-lock"
                        onClick={submit}
                        loading={loading}
                    />
                </div>
                <div className="flex flex-row justify-content-center mt-2">
                    {error && <small className="text-red-500">{error}</small>}
                </div>
            </Card>
        </div>
    );
}
