import { getUserFullProgress } from "@/utils/levelProgress";
import { useEffect, useState } from "react";

interface LevelBadgeProps {
    totalXp: number;
    previousXp: number;
    rank: number;
}

export default function LevelBadge({
    totalXp,
    previousXp,
    rank,
}: LevelBadgeProps) {
    const progress = getUserFullProgress(totalXp);

    const previousProgress = previousXp !== undefined
        ? getUserFullProgress(previousXp)
        : null;

    const levelUp = previousProgress && progress.level > previousProgress.level;

    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (!levelUp) {
            return;
        }

        setAnimate(true);

        const timer =
            setTimeout(() => setAnimate(false), 800);
        return () => clearTimeout(timer);
    }, [levelUp]);

    const getRankDisplay = (index: number) => {

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
        <div className={`relative ${animate ? "level-up-animation" : ""}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-contrast shadow-sm">
                {progress.level}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-700 px-1 text-[10px] font-bold text-white">
                {getRankDisplay(rank)}
            </div>
        </div>
    );
}