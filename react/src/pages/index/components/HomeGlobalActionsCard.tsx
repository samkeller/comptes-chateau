import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { Button, ButtonProps } from "primereact/button";
import { Card } from "primereact/card";
import { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { generatePath } from "react-router-dom";
import { routePaths } from "@/routes/routePaths";

interface HomeGlobalActionsCardProps {
    assignedKanbanTasksCount: number
    totalOperationsToCheck: number;
}

export default function HomeGlobalActionsCard({ assignedKanbanTasksCount, totalOperationsToCheck }: HomeGlobalActionsCardProps) {
    const navigate = useNavigate();
    const localStorageUtils = new LocalStorageUtils();

    const actionLine = (
        flavorText: ReactElement,
        button: ButtonProps,
    ) => {
        return (
            <div className="flex justify-between items-center gap-3">
                {flavorText}
                <Button
                    text
                    severity="warning"
                    iconPos="right"
                    {...button}
                />
            </div>
        )
    }

    return (
        <Card title="Actions" className="h-full">
            {
                assignedKanbanTasksCount === 0 &&
                totalOperationsToCheck === 0 && (

                    <div className="flex flex-col items-center gap-4 py-12">
                        <i className="pi pi-check-circle text-green-500 text-4xl" />
                        <span className="text-surface-500 text-base">All done !</span>
                    </div>
                )
            }
            {
                assignedKanbanTasksCount !== 0 &&
                actionLine(
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary-700">{assignedKanbanTasksCount}</span>
                        <small className="text-surface-500 text-base">taches assignees</small>
                    </div>,
                    {
                        label: "Kanban",
                        icon: "pi pi-arrow-right",
                        onClick: () => navigate("/kanban"),
                    })
            }
            {
                totalOperationsToCheck !== 0 &&
                localStorageUtils.getActiveAccountId() !== null &&
                actionLine(
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary-700">{totalOperationsToCheck}</span>
                        <small className="text-surface-500 text-base">operations à vérifier</small>
                    </div>,
                    {
                        label: "Vérifier",
                        icon: "pi pi-arrow-right",
                        onClick: () => navigate(generatePath(routePaths.account.accountChecks, {
                            accountId: String(localStorageUtils.getActiveAccountId()),
                        })),
                    })
            }
        </Card>
    );
}
