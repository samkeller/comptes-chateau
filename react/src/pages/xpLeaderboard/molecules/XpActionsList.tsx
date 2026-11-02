import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import type { UserXpAction } from "@/interfaces/core/UserXpAction";
import { USER_XP_CATEGORIES } from "@chocosous/shared";

interface XpActionsListProps {
    actions: UserXpAction[];
    className?: string;
}

export default function XpActionsList({ actions, className = "" }: XpActionsListProps) {
    const groupedActions = actions.reduce<Record<string, UserXpAction[]>>((acc, action) => {
        const category = action.category.key;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(action);
        return acc;
    }, {});

    const getCategoryLabel = (category: string): string => {
        return USER_XP_CATEGORIES[category as keyof typeof USER_XP_CATEGORIES] || category;
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            ACCOUNTING: "info",
            KANBAN: "success",
            STOCK: "warning",
            BANKING: "danger",
        };
        return colors[category] || "secondary";
    };

    return (
        <Card className={className} title="Actions qui rapportent de l'XP">
            <div className="flex flex-col gap-4">
                {Object.entries(groupedActions).map(([category, categoryActions]) => (
                    <div key={category} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Tag
                                value={getCategoryLabel(category)}
                                severity={getCategoryColor(category) as any}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {categoryActions.map((action) => (
                                <div
                                    key={action.key}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-surface p-3"
                                >
                                    <span className="text-sm">{action.label}</span>
                                    <Tag
                                        value={`+${action.xp} XP`}
                                        severity="success"
                                        className="shrink-0 font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
