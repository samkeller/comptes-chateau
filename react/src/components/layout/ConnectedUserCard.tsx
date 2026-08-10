import UserAvatar from "@/components/atoms/UserAvatar";
import { useConnectedUser } from "@/context/ConnectedUserContext";
import { useXpFeedbackPulse } from "@/context/XpFeedbackContext";
import { useScreen } from "@/utils/hooks/useScreen";
import { getUserFullProgress } from "@/utils/levelProgress";
import { ProgressBar } from "primereact/progressbar";

export default function ConnectedUserCard() {
    const { connectedUser, loading } = useConnectedUser();
    const { pulseType, lastGainedXp } = useXpFeedbackPulse();
    const { isMobile } = useScreen();

    if (loading || !connectedUser) {
        return (
            <div className="h-12 w-44 rounded-lg border border-surface bg-surface-100 animate-pulse" />
        );
    }

    const progress = getUserFullProgress(connectedUser.totalXp);
    const pulseClass = pulseType === "level-up"
        ? "bg-yellow-500/10"
        : pulseType === "gain"
            ? "bg-primary/5"
            : "";

    const levelTooltip = `Niveau ${progress.level} - ${progress.totalXp} XP - ${Math.round(progress.progressPercent)}%`;
    return (
        <div
            className={`flex items-center gap-3 rounded-lg bg-surface-100 px-3 py-2 transition-colors duration-500 ${pulseClass}`}
        >
            <UserAvatar user={connectedUser} />
            <div className="min-w-0 sm:w-44" title={levelTooltip}>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{connectedUser.username}</span>
                    <span className="text-xs font-bold">Lv {progress.level}</span>
                </div>
                {!isMobile &&
                    <ProgressBar
                        value={progress.progressPercent}
                        showValue={false}
                        style={{
                            height: "6px",
                            marginTop: "0.25rem",
                        }}
                    />
                }
                <div className="mt-1 text-[11px] text-muted-color">
                    <div className="flex flex-row flex-wrap items-center gap-1 text-[11px] font-semibold">
                        <span className="mr-1">{progress.totalXp} XP ({Math.round(progress.progressPercent)}%)</span>

                        {
                            pulseType === "level-up" &&
                            <div className="text-yellow-300 motion-safe:animate-bounce motion-reduce:animate-none">Level up ✨</div>
                        }

                        {
                            lastGainedXp && pulseType === "gain" &&
                            <div className="text-primary">+{lastGainedXp} XP</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
