import { ProgressBar } from "primereact/progressbar";
import { getUserFullProgress } from "@/utils/levelProgress";
import { useConnectedUser } from "@/context/ConnectedUserContext";
import { Tooltip } from "primereact/tooltip";
import { useXpStore } from "@/stores/useXpStore";
import LevelBadge from "@/components/atoms/LevelBadge/LevelBadge";

export default function DojoXpLeaderboard() {
    const users = useXpStore(state => state.users);
    const { connectedUser } = useConnectedUser();

    const rankedUsers = [...users].sort(
        (a, b) => b.totalXp - a.totalXp
    );

    return (
        <div className="flex flex-row gap-2 w-full">
            {rankedUsers.map((user, index) => {
                const progress = getUserFullProgress(user.totalXp);
                const isConnectedUser = user.id === connectedUser?.id;

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
                                previousXp={user.previousXp}
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
                                            <span className="text-xs text-500 whitespace-nowrap">
                                                {user.totalXp.toLocaleString()} XP
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
                                            {progress.xpThisLevel}
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