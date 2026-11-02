import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { useMemo } from "react";
import type { UserXpAction } from "@/interfaces/core/UserXpAction";
import { UserXpCategory, UserXpCategoryKey } from "@/interfaces/core/UserXpCategory";

interface GroupedActions {
    key: UserXpCategoryKey,
    category: UserXpCategory;
    actions: UserXpAction[];
}

interface XpActionsListProps {
    actions: UserXpAction[];
    className?: string;
}


export default function XpActionsList({ actions, className = "" }: XpActionsListProps) {

    const groupedActionsArray = useMemo(() => {
        // Reduce Action
        const groups = actions.reduce<Record<UserXpCategoryKey, GroupedActions>>((acc, action) => {
            const key = action.category.key;

            // Creation du groupe par clef s'il n'existe pas encore
            if (!acc[key]) {
                acc[key] = {
                    key,
                    category: action.category,
                    actions: [],
                };
            }

            // Ajout de l'action au groupe
            acc[key].actions.push(action);

            return acc;
        }, {} as Record<UserXpCategoryKey, GroupedActions>);

        return Object.values(groups);
    }, [actions]);

    return (
        <Card className={className} title="Actions qui rapportent de l'XP">
            <div className="flex flex-col gap-4">
                {groupedActionsArray.map(({ key, category, actions }) => (
                    <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Tag
                                value={category.label}
                                severity={category.color}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {actions.map((action) => (
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
