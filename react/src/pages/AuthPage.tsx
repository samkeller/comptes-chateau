import { useEffect, useState } from "react";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import ChocoChou from "@assets/images/chocochou.png";
import { useGlobalToast } from "../context/GlobalToastContext";
import { SelectButton } from "primereact/selectbutton";

export default function AuthPage() {
    const [username, setUsername] = useState<"Gaelle" | "Sam" | "70ul0u53&b3rl10z">("Gaelle");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [authService] = useState(new AuthService());
    let navigate = useNavigate();
    const showGlobalToast = useGlobalToast();

    useEffect(() => { setError(null) }, [password])

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
        <div className="flex items-center justify-center min-h-screen">
            <Card
                header={
                    <div className="text-center">
                        <img
                            src={ChocoChou}
                            alt="Chat triste"
                            className="w-full rounded-border mb-6"
                            style={{ maxHeight: 260, objectFit: "cover" }}
                        />
                    </div>
                }
                title="Passer la choco-sécurité"
                className="w-full sm:w-[30rem]"
            >
                <div className="p-fluid flex flex-col gap-6">
                    <div>
                        <SelectButton
                            value={username}
                            onChange={(e) => setUsername(e.value)}
                            options={["Gaelle", "Sam", "70ul0u53&b3rl10z"]}
                            optionDisabled={v => v === "70ul0u53&b3rl10z"}

                        />
                    </div>
                    <Password
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        feedback={false}
                        toggleMask
                        placeholder="Mot de passe"
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                    />
                    <div className="flex justify-end">
                        <Button
                            label="Connexion"
                            icon="pi pi-lock"
                            onClick={submit}
                            loading={loading}
                        />
                    </div>
                </div>
                <div className="flex flex-row justify-center mt-2">
                    {error && <small className="text-red-500">{error}</small>}
                </div>
            </Card>
        </div>
    );
}
