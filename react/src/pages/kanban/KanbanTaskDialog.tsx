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


interface KanbanTaskDialogProps {
    columns: KanbanColumn[],
    task: KanbanTask,
    closeDialog: (reloadList: boolean) => void
}

export default function KanbanTaskDialog({ columns, task, closeDialog }: KanbanTaskDialogProps) {
    const service = new KanbanService();
    /**
     * Obligé de copier l'objet task dans un state local pour pouvoir éditer les champs, sinon on modifie directement l'objet passé en props et ça fait n'importe quoi (le formulaire se met à jour à chaque changement de champ et perd le focus)
     */
    const [taskData, setTaskData] = useState<KanbanTask>({ ...task });

    function handleSubmit() {
        service.saveKanbanTask(taskData).then(() => {
            showGlobalToast({
                severity: "success",
                summary: "Tâche modifiée.",
            })
            closeDialog(true);
        })
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
        <div className="flex justify-content-between align-items-center w-full pr-3">
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
                className="py-0 h-2rem w-2rem"
                tooltip="Supprimer"
                onClick={deleteTask}
            />
        </div>
    );
    const footer = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={() => closeDialog(false)} />
            {/* <Button label={task.selectedColumn ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} /> */}
            <Button label={"Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
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
            <div className="pt-4 flex flex-column gap-4">

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
                    <InputTextarea
                        id="description-input"
                        className="w-full"
                        value={taskData.description || ""}
                        onChange={e => setTaskData({ ...taskData, description: e.target.value })}
                    />
                    <label htmlFor="description-input">Description</label>
                </FloatLabel>
            </div>

        </Dialog>
    )
}