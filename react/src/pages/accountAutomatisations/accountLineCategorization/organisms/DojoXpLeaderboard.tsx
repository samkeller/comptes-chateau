import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ProgressBar } from "primereact/progressbar";
import { getUserFullProgress } from "@/utils/levelProgress";
import UserService from "@/services/UserService";
import { useConnectedUser } from "@/context/ConnectedUserContext";
import { Tooltip } from 'primereact/tooltip';
import { User } from "@/interfaces/User";

export interface DojoXpLeaderboardHandle {
    refresh: () => Promise<void>;
}

export default forwardRef<DojoXpLeaderboardHandle, {}>(function DojoXpLeaderboard(_props, ref) {
    const [users, setUsers] = useState<User[]>([]);
    const { connectedUser } = useConnectedUser();

    const fetchUsers = async () => {
        const usersFromServer = await new UserService().getAllUsers();
        setUsers(usersFromServer);
    };

    useEffect(() => {
        void fetchUsers();
    }, []);

    useImperativeHandle(ref, () => ({
        refresh: async () => {
            await fetchUsers();
        },
    }), []);

    const rankedUsers = [...users].sort(
        (a, b) => (b.totalXp) - (a.totalXp)
    );

    if (!rankedUsers.length) {
        return (
            <div className="rounded-xl border border-surface p-4 text-center text-sm text-500">
                Chargement du classement...
            </div>
        );
    }

    const getRank = (index: number) => {
        switch (index) {
            case 0:
                return "🥇"
            case 1:
                return "🥈"
            case 2:
                return "🥉"
            default:
                return `#${index + 1}`
        }
    }

    return (
        <div className="flex flex-row gap-2">
            {rankedUsers.map((user, index) => {
                const progress = getUserFullProgress(user.totalXp);
                const isConnectedUser = user.id === connectedUser?.id
                return (
                    <>
                        {
                            !isConnectedUser && <Tooltip target={".tooltip-leaderboard-user-" + user.id} />
                        }
                        <div
                            key={user.id}
                            className={`${"tooltip-leaderboard-user-" + user.id} flex flex-row items-center gap-3 rounded-xl px-3 py-2 ${isConnectedUser && "grow"}`}
                            data-pr-tooltip={`${user.username} - LVL ${progress.level} (${progress.progressPercent.toFixed()}%)`}
                            data-pr-position="top"
                        >
                            {/* Niveau */}
                            <div className="relative">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-contrast shadow-sm">
                                    {progress.level}
                                </div>

                                <div
                                    className="
                                    absolute -bottom-1 -right-1
                                    flex h-5 min-w-5 items-center justify-center
                                    rounded-full bg-surface-700 px-1
                                    text-[10px] font-bold text-white
                                "
                                >
                                    {getRank(index)}
                                </div>
                            </div>
                            {/* Infos */}
                            {
                                isConnectedUser && (

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className={`truncate font-medium text-primary`}>
                                                {user.username}
                                            </span>
                                            <span className="text-xs text-500 whitespace-nowrap">
                                                {(user.totalXp).toLocaleString()} XP
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={progress.progressPercent}
                                            showValue={false}
                                            style={{ height: "6px" }}
                                        />

                                        <div className="mt-1 text-[11px] text-500">
                                            <span>
                                                {progress.xpThisLevel} / {" "}
                                                {progress.nextLevelXp - progress.currentLevelXp} XP {" "}
                                                ({progress.progressPercent.toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>

                                )
                            }
                        </div>
                    </>

                );
            })}
        </div>
    );
});