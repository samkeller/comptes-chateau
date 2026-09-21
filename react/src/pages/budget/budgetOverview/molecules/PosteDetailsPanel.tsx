import { toMonetaryAmount } from "@/utils/NumberUtils";
import { GroupedBudgetData } from "../BudgetOverviewCalculations";
import SourceBadge from "../atoms/SourceBadge";
import ColorDot from "@/components/atoms/ColorDot";

interface PosteDetailsPanelProps {
    posteData: GroupedBudgetData;
    onClose: () => void;
}

export default function PosteDetailsPanel({ posteData, onClose }: PosteDetailsPanelProps) {
    return (
        <div className="flex flex-col h-full bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 animate-fade-in">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                    <ColorDot color={posteData.posteColor || "#38bdf8"} />
                    <h4 className="font-semibold text-slate-100 text-sm truncate">
                        {posteData.posteLabel}
                    </h4>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-100 p-1 rounded-md hover:bg-slate-700 transition-colors text-xs"
                    title="Fermer"
                >
                    ✕
                </button>
            </div>

            {/* Lines list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 max-h-[340px]">
                {posteData.lines.map((line) => (
                    <div
                        key={line.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
                    >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <SourceBadge source={line.source} />
                            <span className="text-slate-300 truncate font-medium">{line.label}</span>
                        </div>
                        {toMonetaryAmount(line.amount)}
                    </div>
                ))}
            </div>
        </div>
    );
};