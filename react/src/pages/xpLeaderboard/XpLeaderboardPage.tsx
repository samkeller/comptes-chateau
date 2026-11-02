import { useCallback, useEffect, useState } from "react";
import { PageTemplate } from "../PageTemplate";
import UserXpService from "@/services/UserXpService";
import type { UserXpLog } from "@/interfaces/core/UserXpLog";
import XpPodium from "./atoms/XpPodium";
import XpActionsList from "./molecules/XpActionsList";
import XpLogsList from "./molecules/XpLogsList";
import type { UserXpAction } from "@/interfaces/core/UserXpAction";

const userXpService = new UserXpService();

export default function XpLeaderboardPage() {
    const [actions, setActions] = useState<UserXpAction[]>([]);
    const [logs, setLogs] = useState<UserXpLog[]>([]);

    const loadData = useCallback(async () => {
        const [loadedActions, loadedLogs] = await Promise.all([
            userXpService.getActions(),
            userXpService.getAllLogs(),
        ]);
        setActions(loadedActions);
        setLogs(loadedLogs);
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <PageTemplate pageTitle="Leaderboard XP">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                {/* Colonne gauche : Podium + Actions */}
                <div className="flex flex-col gap-4">
                    <XpPodium />
                    <XpActionsList actions={actions} />
                </div>

                {/* Colonne droite : Logs */}
                <XpLogsList logs={logs} />
            </div>
        </PageTemplate>
    );
}
