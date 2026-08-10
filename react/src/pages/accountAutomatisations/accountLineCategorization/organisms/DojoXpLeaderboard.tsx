import { ProgressBar } from "primereact/progressbar";
import { getUserFullProgress } from "@/utils/levelProgress";
import { useConnectedUser } from "@/context/ConnectedUserContext";
import { Tooltip } from "primereact/tooltip";
import LevelBadge from "@/components/LevelBadge";
import { useEffect, useMemo, useState } from "react";
import UserService from "@/services/UserService";
import { User } from "@/interfaces/User";
import { useXpFeedbackPulse } from "@/context/XpFeedbackContext";

export default function DojoXpLeaderboard() {
    const { connectedUser } = useConnectedUser();
    const { previousTotalXp } = useXpFeedbackPulse();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const service = new UserService();

        service.getAllUsers()
            .then((allUsers) => setUsers(allUsers))
            .catch(() => setUsers([]));
    }, []);

    useEffect(() => {
        if (!connectedUser) {
            return;
        }

        setUsers((previousUsers) => {
            const hasConnectedUser = previousUsers.some((user) => user.id === connectedUser.id);

            if (!hasConnectedUser) {
                return [...previousUsers, connectedUser];
            }

            return previousUsers.map((user) => (user.id === connectedUser.id ? connectedUser : user));
        });
    }, [connectedUser]);

    const rankedUsers = useMemo(() => {
        return [...users].sort((a, b) => b.totalXp - a.totalXp);
    }, [users]);

    return (
        <div className="flex flex-row gap-2 w-full">
            {rankedUsers.map((user, index) => {
                const progress = getUserFullProgress(user.totalXp);
                const isConnectedUser = user.id === connectedUser?.id;
                const previousXp = isConnectedUser && typeof previousTotalXp === "number"
                    ? previousTotalXp
                    : user.totalXp;

                return (
                    <div
                        key={user.id}
                        className={`flex flex-row items-center gap-3 rounded-xl px-3 py-2 ${isConnectedUser ? "grow" : ""}`}
                    >
                        {
                            !isConnectedUser &&
                            <Tooltip
                                target={".tooltip-leaderboard-user-" + user.id}
                            />
                        }
                        <div
                            className={`tooltip-leaderboard-user-${user.id} flex flex-row items-center gap-3  rounded-xl px-3 py-2 ${isConnectedUser && "grow"}`}
                            data-pr-tooltip={`${user.username} - LVL ${progress.level} (${progress.progressPercent.toFixed()}%)`}
                            data-pr-position="top"
                        >

                            <LevelBadge
                                totalXp={user.totalXp}
                                previousXp={previousXp}
                                rank={index}
                            />
                            {/* Infos utilisateur connecté */}
                            {
                                isConnectedUser && (
                                    <div className="min-w-0 flex-1">
                                        <div
                                            className="mb-1 flex items-center justify-between"
                                        >
                                            <span className="truncate font-medium text-primary">
                                                {user.username}
                                            </span>
                                        </div>
                                        <ProgressBar
                                            value={progress.progressPercent}
                                            showValue={false}
                                            style={{
                                                height: "6px"
                                            }}
                                        />
                                        <div className="mt-1 text-[11px] text-500">
                                            {progress.totalXp.toLocaleString()}
                                            {" / "}
                                            {progress.nextLevelXp - progress.currentLevelXp}
                                            {" XP "}
                                            (
                                            {progress.progressPercent.toFixed(0)}
                                            %)
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );
}