import { getUserFullProgress } from "@/utils/levelProgress";
import { User } from "@/interfaces/core/User";
import { useMemo } from "react";
import UserAvatar from "@/components/atoms/UserAvatar";

interface XpPodiumPlayerProps {
    user: User;
    rank: number;
    isConnectedUser: boolean;
}

export default function XpPodiumPlayer({
    user,
    rank,
    isConnectedUser,
}: XpPodiumPlayerProps) {
    const progress = getUserFullProgress(user.totalXp);

    const podiumConfig = useMemo(() => {
        switch (rank) {
            case 0:
                return {
                    medal: "🥇",
                    bgColor: "bg-yellow-500/20",
                    borderColor: "border-yellow-500",
                    textColor: "text-yellow-500",
                    shadowColor: "shadow-yellow-500/50",
                    height: "h-48",
                    crown: "👑",
                    scale: "scale-110",
                };
            case 1:
                return {
                    medal: "🥈",
                    bgColor: "bg-slate-400/20",
                    borderColor: "border-slate-400",
                    textColor: "text-slate-400",
                    shadowColor: "shadow-slate-400/50",
                    height: "h-36",
                    crown: null,
                    scale: "scale-100",
                };
            case 2:
                return {
                    medal: "🥉",
                    bgColor: "bg-orange-600/20",
                    borderColor: "border-orange-600",
                    textColor: "text-orange-600",
                    shadowColor: "shadow-orange-600/50",
                    height: "h-28",
                    crown: null,
                    scale: "scale-100",
                };
            default:
                return null;
        }
    }, [rank]);

    if (!podiumConfig) {
        return null;
    }

    return (
        <div className={`flex flex-col items-center gap-3 transition-all duration-500 ${podiumConfig.scale}`}>
            {/* Badge de niveau */}
            <div className={`relative inline-flex rounded-full ${isConnectedUser ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-900" : ""}`}>

                {/* Couronne */}
                {podiumConfig.crown && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 text-3xl">
                        {podiumConfig.crown}
                    </div>
                )}
                <UserAvatar user={user} />

                {/* Effet de glow pour le premier */}
                {rank === 0 && (
                    <div className="absolute inset-0 rounded-full bg-yellow-500/30 blur-xl animate-pulse pointer-events-none" />
                )}
            </div>

            {/* Informations du joueur */}
            <div className={`flex flex-col items-center gap-1 text-center ${podiumConfig.textColor}`}>
                <span className={`font-semibold ${isConnectedUser ? "text-primary" : ""}`}>
                    {user.username}
                </span>
                <span className="text-sm font-medium">LVL {progress.level}</span>
                <span className="text-xs opacity-75">
                    {progress.totalXp.toLocaleString()} XP
                </span>
            </div>

            {/* Marche du podium */}
            <div
                className={`w-24 ${podiumConfig.height} rounded-t-lg border-2 ${podiumConfig.bgColor} ${podiumConfig.borderColor} ${podiumConfig.shadowColor} shadow-lg flex items-center justify-center`}
            >
                <span className={`text-3xl font-bold ${podiumConfig.textColor}`}>
                    {podiumConfig.medal}
                </span>
            </div>
        </div>
    );
}
