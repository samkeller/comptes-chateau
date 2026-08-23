import { Dialog } from "primereact/dialog"
import KanbanColumn from "../../../interfaces/kanban/KanbanColumn"
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import KanbanService from "../../../services/kanban/KanbanService";
import KanbanTask from "../../../interfaces/kanban/KanbanTask";
import { showGlobalToast } from "../../../services/GlobalToast";
import { User } from "../../../interfaces/User";
import TailwindTag from "@/components/atoms/TailwindTag";
import { CreateKanbanTaskDto } from "@/services/kanban/dto/CreateKanbanTaskDto";
import KanbanCommentSection from "./KanbanCommentSection";
import { useScreen } from "@/hooks/useScreen";
import KanbanTaskDialogForm from "../molecules/KanbanTaskDialogForm";
import { TabMenu } from "primereact/tabmenu";


interface KanbanTaskDialogProps {
    columns: KanbanColumn[],
    allTags: string[],
    allUsers: User[],
    task: KanbanTask,
    closeDialog: (reloadList: boolean) => void
}

export default function KanbanTaskDialog({ columns, allTags, allUsers, task, closeDialog }: KanbanTaskDialogProps) {
    const service = new KanbanService();
    const { isMobile } = useScreen();
    const [activeSection, setActiveSection] = useState<"task" | "comments">("task");
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    /**
     * Obligé de copier l'objet task dans un state local pour pouvoir éditer les champs, sinon on modifie directement l'objet passé en props et ça fait n'importe quoi (le formulaire se met à jour à chaque changement de champ et perd le focus)
     */
    const [taskData, setTaskData] = useState<CreateKanbanTaskDto>({
        ...task,
        assigneeIds: task.assignees.map(assignee => assignee.id),
    });

    const isCreation = task.id === 0;

    const tabs = [
        {
            label: "Tâche",
            icon: "pi pi-pencil",
        },
        ...(!isCreation
            ? [{
                label: "Commentaires",
                icon: "pi pi-comments",
            }]
            : []),
    ];

    useEffect(() => {
        if (isCreation && activeSection === "comments") {
            setActiveSection("task");
        }
    }, [isCreation, activeSection]);


    function handleSubmit() {
        const persistPromise = isCreation
            ? service.createKanbanTask(taskData)
            : service.saveKanbanTask(taskData, task.id);

        persistPromise
            .then(() => {
                showGlobalToast({
                    severity: "success",
                    summary: isCreation ? "Tâche ajoutée" : "Tâche modifiée",
                });
                closeDialog(true);
            })
    }

    function deleteTask() {
        service
            .deleteTask(task.id)
            .then(() => {
                showGlobalToast({
                    severity: "success",
                    summary: "Tâche supprimée",
                });
                closeDialog(true);
            })
    }

    function markTaskAsDone() {
        service
            .markTaskAsDone(task.id)
            .then(() => {
                showGlobalToast({
                    severity: "success",
                    summary: "Tâche terminée !",
                    detail: "Bravo à toute la chocoteam pour ce chocoexploit ! 🍫😺"
                });
                closeDialog(true);
            })
    }

    const header = (
        <div className="flex flex-row gap-2 justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
                <TailwindTag>
                    {task.id === 0 ? "New" : `#${task.id}`}
                </TailwindTag>
                <h2>{taskData.title}</h2>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-auto">
                {!isCreation && !task.isDone && (
                    <Button
                        rounded
                        text
                        icon="pi pi-check"
                        severity="success"
                        className="py-0 h-8 w-8"
                        tooltip="Marquer comme terminée"
                        onClick={markTaskAsDone}
                    />
                )}
                {!isCreation && task.isDone && (
                    <span className="flex items-center gap-1 text-green-400 text-sm px-1">
                        <i className="pi pi-check-circle" />
                        Terminée
                    </span>
                )}
                {!isCreation && (
                    <Button
                        rounded
                        text
                        icon="pi pi-trash"
                        severity="danger"
                        className="py-0 h-8 w-8"
                        tooltip="Supprimer"
                        onClick={deleteTask}
                    />
                )}
            </div>
        </div>
    );

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={() => closeDialog(false)} />
            <Button label={isCreation ? "Ajouter" : "Modifier"} icon="pi pi-check" onClick={handleSubmit} />
        </div>
    );

    return (
        <Dialog
            visible
            onHide={() => closeDialog(false)}
            className="w-[90vw] max-w-300 h-[90vh] p-0"
            contentClassName="flex flex-col min-h-0 flex-1 overflow-hidden"
            closeOnEscape
            dismissableMask
            draggable={false}
            header={header}
            footer={footer}
        >
            {/* Tabs mobile */}
            {isMobile && (
                <TabMenu
                    className="shrink-0 pb-4"
                    model={tabs}
                    activeIndex={activeTabIndex}
                    onTabChange={(e) => setActiveTabIndex(e.index)}
                />
            )}

            {/* Main content */}
            <div className="flex gap-6">
                {/* Left column: task form */}
                {(!isMobile || activeTabIndex === 0) && (
                    <div className="flex-1">
                        <KanbanTaskDialogForm
                            taskData={taskData}
                            setTaskData={setTaskData}
                            allTags={allTags}
                            columns={columns}
                            allUsers={allUsers}
                        />
                    </div>
                )}

                {/* Right column: comments */}
                {
                    (!isMobile || activeTabIndex === 1) && !isCreation &&
                    <div className="flex-1">
                        <KanbanCommentSection taskId={task.id} />
                    </div>
                }
            </div>

        </Dialog>
    )
}