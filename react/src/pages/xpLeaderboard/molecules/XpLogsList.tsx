import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Chip } from "primereact/chip";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import type { UserXpLog } from "@/interfaces/core/UserXpLog";
import { formatDistanceToNow } from "@/utils/DatesUtils";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import ColorDot from "@/components/atoms/ColorDot";
import { getNiceColorFromString } from "@/utils/colorUtils";

interface XpLogsListProps {
    logs: UserXpLog[];
}

export default function XpLogsList({ logs }: XpLogsListProps) {
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="h-full min-h-0">

            <Card
                title="Derniers gains d'XP"
                className="h-full flex flex-column"
            >
                <FillRemainingHeight offset={60}>
                    <DataTable
                        value={sortedLogs}
                        size="small"
                        scrollable
                        scrollHeight="flex"
                        emptyMessage="Aucun gain d'XP enregistré"
                    >
                        <Column
                            field="user.username"
                            header="Utilisateur"
                            body={(log: UserXpLog) => (
                                <div className="flex gap-1 items-center text-pretty text-sm">
                                    <ColorDot color={getNiceColorFromString(log.user.username)} />
                                    <span>{log.user.username}</span>
                                </div>
                            )}
                        />
                        <Column
                            field="category"
                            header="Catégorie"
                            body={(log: UserXpLog) => (
                                <Tag
                                    value={log.category.label}
                                    severity={log.category.color}
                                />
                            )}
                        />
                        <Column
                            field="label"
                            header="Action"
                            body={(log: UserXpLog) => (
                                <span className="text-pretty text-sm text-500">
                                    {log.label}
                                </span>
                            )}
                        />
                        <Column
                            field="actionXp"
                            header="XP"
                            body={(log: UserXpLog) => {
                                const totalXp = log.actionXp * log.multiplicator;
                                // label = valeur totale.
                                let label = `+${totalXp} XP`;

                                // Si multiplicateur > 1, on ajoute le suffixe " - {valeur totale} x {multiplicateur}"
                                if (log.multiplicator > 1) {
                                    label += ` (${log.actionXp} x ${log.multiplicator})`;
                                }

                                return (
                                    <Chip
                                        className="text-sm"
                                        label={label}
                                    />
                                );
                            }}
                        />
                        <Column
                            field="createdAt"
                            header="Date"
                            body={(log: UserXpLog) => (
                                <span className="text-sm text-500">
                                    {formatDistanceToNow(new Date(log.createdAt))}
                                </span>
                            )}
                        />
                    </DataTable>
                </FillRemainingHeight>
            </Card>
        </div>
    );
}
