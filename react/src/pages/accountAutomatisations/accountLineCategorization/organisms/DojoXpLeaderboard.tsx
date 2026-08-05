import { useEffect, useRef, useState } from "react";
import { ProgressBar } from "primereact/progressbar";
import { getUserFullProgress } from "@/utils/levelProgress";
import UserService from "@/services/UserService";
import { useConnectedUser } from "@/context/ConnectedUserContext";
import { Tooltip } from 'primereact/tooltip';
import { User } from "@/interfaces/User";

interface DojoXpLeaderboardProps {
    /** Increment this key to force a refresh of the leaderboard */
    refreshKey?: number;
}

export default function DojoXpLeaderboard({ refreshKey = 0 }: DojoXpLeaderboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const { connectedUser } = useConnectedUser();
    const prevTotalXpRef = useRef<number | null>(connectedUser?.totalXp ?? null);
    const [animatedTotalXp, setAnimatedTotalXp] = useState<number>(connectedUser?.totalXp ?? 0);
    const [animatedPercent, setAnimatedPercent] = useState<number>(0);

    const fetchUsers = async () => {
        const usersFromServer = await new UserService().getAllUsers();
        setUsers(usersFromServer);
    };

    useEffect(() => {
        void fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // refresh when parent bump refreshKey
        void fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        // animate connected user XP/percent when it changes
        const newTotal = connectedUser?.totalXp ?? 0;
        const prevTotal = prevTotalXpRef.current ?? newTotal;
        if (newTotal === prevTotal) return;

        const prevProgress = getUserFullProgress(prevTotal);
        const newProgress = getUserFullProgress(newTotal);

        const duration = 700;
        const start = performance.now();

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = easeOutCubic(t);
            const currentXp = Math.round(prevTotal + (newTotal - prevTotal) * eased);
            const currentPercent = prevProgress.progressPercent + (newProgress.progressPercent - prevProgress.progressPercent) * eased;
            setAnimatedTotalXp(currentXp);
            setAnimatedPercent(currentPercent);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                prevTotalXpRef.current = newTotal;
            }
        };

        requestAnimationFrame(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectedUser?.totalXp]);

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
                const displayPercent = isConnectedUser ? animatedPercent : progress.progressPercent;
                const displayTotalXp = isConnectedUser ? animatedTotalXp : user.totalXp;

                return (
                    <div
                        key={user.id}
                        className={`${"tooltip-leaderboard-user-" + user.id} flex flex-row items-center gap-3 rounded-xl px-3 py-2 ${isConnectedUser && "grow"}`}
                        data-pr-tooltip={`${user.username} - LVL ${progress.level} (${progress.progressPercent.toFixed()}%)`}
                        data-pr-position="top"
                    >
                        {/* Tooltip only for non-connected users to avoid extra DOM refs */}
                        {!isConnectedUser && <Tooltip target={".tooltip-leaderboard-user-" + user.id} />}

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
                        {isConnectedUser && (
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className={`truncate font-medium text-primary`}>
                                        {user.username}
                                    </span>
                                    <span className="text-xs text-500 whitespace-nowrap">
                                        {displayTotalXp.toLocaleString()} XP
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded" style={{ height: 10 }}>
                                    <div style={{ height: 6 }}>
                                        <ProgressBar
                                            value={Math.max(0, Math.min(100, displayPercent))}
                                            showValue={false}
                                            style={{ height: "6px" }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-1 text-[11px] text-500">
                                    <span>
                                        {getUserFullProgress(displayTotalXp).xpThisLevel} / {" "}
                                        {getUserFullProgress(displayTotalXp).nextLevelXp - getUserFullProgress(displayTotalXp).currentLevelXp} XP {" "}
                                        ({Math.round(displayPercent)}%)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}