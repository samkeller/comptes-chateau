import { Dialog } from "primereact/dialog"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputTextarea } from "primereact/inputtextarea";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import { showGlobalToast } from "../../services/GlobalToast";
import EditableString from "../../components/form/EditableString";
import { KanbanTaskPriority, KANBAN_TASK_PRIORITIES } from "../../interfaces/kanban/KanbanTaskPriority";
import PriorityFlag, { getPriorityLabel } from "./atoms/PriorityFlag";


interface KanbanTaskDialogProps {
    columns: KanbanColumn[],
    task: KanbanTask,
    closeDialog: (reloadList: boolean) => void
}

export default function KanbanTaskDialog({ columns, task, closeDialog }: KanbanTaskDialogProps) {
    const service = new KanbanService();
    const priorityOptions = KANBAN_TASK_PRIORITIES.map(value => ({
        value,
        label: getPriorityLabel(value),
    }));

    /**
     * Obligé de copier l'objet task dans un state local pour pouvoir éditer les champs, sinon on modifie directement l'objet passé en props et ça fait n'importe quoi (le formulaire se met à jour à chaque changement de champ et perd le focus)
     */
    const [taskData, setTaskData] = useState<KanbanTask>({ ...task });

    const isCreation = task.id === 0;

    async function handleSubmit() {


        if (isCreation) {
            // Si l'id de la tâche est 0, c'est qu'on est en train de créer une nouvelle tâche, donc on appelle la méthode de création
            await service.createKanbanTask(taskData)
                .catch(() => {
                    // TODO: Gestion des erreurs plus fine
                    showGlobalToast({
                        severity: "error",
                        summary: "Erreur lors de la création de la tâche.",
                    });
                    throw new Error("Erreur lors de la création de la tâche.");
                });
        } else {
            // Sinon, on est en train de modifier une tâche existante, donc on appelle la méthode de modification
            await service.saveKanbanTask(taskData).catch(() => {
                // TODO: Gestion des erreurs plus fine
                showGlobalToast({
                    severity: "error",
                    summary: "Erreur lors de la modification de la tâche.",
                });
                throw new Error("Erreur lors de la modification de la tâche.");
            });
        }
        showGlobalToast({
            severity: "success",
            summary: isCreation ? "Tâche ajoutée." : "Tâche modifiée.",
        });
        closeDialog(true);
    }

    async function deleteTask() {
        service.deleteTask(taskData.id).then(() => {
            showGlobalToast({
                severity: "success",
                summary: "Tâche supprimée.",
            })
            closeDialog(true);
        })
    }

    const header = (
        <div className="flex justify-between items-center w-full pr-6">
            <EditableString
                value={taskData.title}
                onValidate={newValue => setTaskData({
                    ...taskData,
                    title: newValue
                })}
            />
            <Button
                rounded
                text
                icon="pi pi-trash"
                severity="danger"
                className="py-0 h-8 w-8"
                tooltip="Supprimer"
                onClick={deleteTask}
            />
        </div>
    );
    const footer = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={() => closeDialog(false)} />
            <Button label={isCreation ? "Ajouter" : "Modifier"} icon="pi pi-check" onClick={handleSubmit} />
        </div>
    );

    return (
        <Dialog

            visible
            onHide={() => closeDialog(false)}
            style={{ width: '50vw' }}
            closeOnEscape
            maximizable
            dismissableMask
            draggable={false}
            header={header}
            footer={footer}
        >
            <div className="pt-12 flex flex-col gap-12">

                <FloatLabel>
                    <Dropdown
                        inputId="category-dropdown"
                        value={columns.find(c => c.id === taskData.columnId) || null}
                        options={columns}
                        onChange={e => e.value && setTaskData({ ...taskData, columnId: e.value.id })}
                        optionLabel="label"
                    />
                    <label htmlFor="category-dropdown">Catégorie</label>
                </FloatLabel>
                <FloatLabel>
                    <Dropdown
                        inputId="priority-dropdown"
                        value={taskData.priority}
                        options={priorityOptions}
                        onChange={e => setTaskData({ ...taskData, priority: e.value as KanbanTaskPriority })}
                        optionLabel="label"
                        optionValue="value"
                        itemTemplate={option => (
                            <div className="flex items-center gap-2">
                                <PriorityFlag priority={option.value} />
                                <span>{option.label}</span>
                            </div>
                        )}
                        valueTemplate={option => {
                            if (!option?.value) {
                                return null;
                            }

                            return (
                                <div className="flex items-center gap-2">
                                    <PriorityFlag priority={option.value} />
                                    <span>{option.label}</span>
                                </div>
                            );
                        }}
                    />
                    <label htmlFor="priority-dropdown">Priorité</label>
                </FloatLabel>
                <FloatLabel>
                    <InputTextarea
                        id="description-input"
                        className="w-full"
                        value={taskData.description || ""}
                        onChange={e => setTaskData({ ...taskData, description: e.target.value })}
                        rows={10}
                    />
                    <label htmlFor="description-input">Description</label>
                </FloatLabel>
            </div>

        </Dialog>
    )
}