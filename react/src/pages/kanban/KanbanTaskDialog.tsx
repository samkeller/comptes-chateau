import { Dialog } from "primereact/dialog"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import KanbanService from "../../services/kanban/KanbanService";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import { showGlobalToast } from "../../services/GlobalToast";
import EditableString from "../../components/form/EditableString";
import { KanbanTaskPriority } from "../../interfaces/kanban/KanbanTaskPriority";
import PriorityFlag, { getPriorityLabel } from "./atoms/PriorityFlag";
import { SelectItem } from "primereact/selectitem";
import MarkdownEditor from "../../components/form/markdown/MarkdownEditor";
import { AutoComplete } from "primereact/autocomplete";
import { useMemo } from "react";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";
import { MultiSelect } from "primereact/multiselect";
import { User } from "../../interfaces/User";
import TailwindTag from "@/components/atoms/TailwindTag";
import { CreateKanbanTaskDto } from "@/services/kanban/dto/CreateKanbanTaskDto";
import UserAvatar from "@/components/atoms/UserAvatar";
import KanbanCommentSection from "./KanbanCommentSection";


interface KanbanTaskDialogProps {
    columns: KanbanColumn[],
    allTags: string[],
    allUsers: User[],
    task: KanbanTask,
    closeDialog: (reloadList: boolean) => void
}

export default function KanbanTaskDialog({ columns, allTags, allUsers, task, closeDialog }: KanbanTaskDialogProps) {
    const service = new KanbanService();

    /**
     * From KANBAN_TASK_PRIORITIES
     */
    const priorityOptions: SelectItem[] = [
        { value: "low", label: getPriorityLabel("low") },
        { value: "normal", label: getPriorityLabel("normal") },
        { value: "high", label: getPriorityLabel("high") },
    ]

    /**
     * Obligé de copier l'objet task dans un state local pour pouvoir éditer les champs, sinon on modifie directement l'objet passé en props et ça fait n'importe quoi (le formulaire se met à jour à chaque changement de champ et perd le focus)
     */
    const [taskData, setTaskData] = useState<CreateKanbanTaskDto>({
        ...task,
        assigneeIds: task.assignees.map(assignee => assignee.id),
    });
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

    const isCreation = task.id === 0;

    const availableTags = useMemo(() => {
        const selectedTags = new Set(taskData.tags);

        return allTags.filter(tag => !selectedTags.has(tag));
    }, [allTags, taskData.tags]);

    function addTag(rawTag: string) {
        const trimmed = rawTag.trim();
        if (!trimmed) {
            return;
        }

        setTaskData({
            ...taskData,
            tags: [...(taskData.tags || []), trimmed],
        });
        setTagSuggestions([]);
    }

    function completeTagSearch(query: string) {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length === 0) {
            setTagSuggestions(availableTags.slice(0, 8));
            return;
        }

        setTagSuggestions(
            availableTags.filter(tag => tag.includes(normalizedQuery)).slice(0, 8),
        );
    }

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
        <div className="flex justify-between items-center w-full gap-2 pr-6">
            <TailwindTag>
                {task.id === 0 ? "New" : `#${task.id}`}
            </TailwindTag>
            <div className="grow">
                <EditableString
                    value={taskData.title}
                    onValidate={newValue => setTaskData({
                        ...taskData,
                        title: newValue
                    })}
                />
            </div>
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
            style={{ width: '80vw' }}
            closeOnEscape
            maximizable
            dismissableMask
            draggable={false}
            header={header}
            footer={footer}
        >
            <div className="pt-12 flex flex-row gap-6">
                {/* Left column: task form */}
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex flex-row gap-4 flex-wrap">
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
                            <AutoComplete
                                inputId="tags-input"
                                multiple
                                value={taskData.tags || []}
                                suggestions={tagSuggestions}
                                completeMethod={event => completeTagSearch(event.query)}
                                onChange={event => setTaskData({ ...taskData, tags: event.value })}
                                onKeyDown={event => {
                                    if (
                                        (event.key === "Enter" || event.key === ",")
                                    ) {
                                        event.preventDefault();
                                        // WORKAROUND: PrimeReact AutoComplete doesn't expose typed input value on onKeyDown
                                        const valueStr: string = (event.target as any).value;
                                        addTag(valueStr);
                                        (event.target as any).value = "";
                                    }
                                }}
                                itemTemplate={option => <KanbanTagDisplay tag={option} />}
                                selectedItemTemplate={option => <KanbanTagDisplay tag={option} />}
                            />
                            <label htmlFor="tags-input">Tags</label>
                        </FloatLabel>
                        <FloatLabel>
                            <MultiSelect
                                inputId="assignees-input"
                                value={allUsers.filter(user => taskData.assigneeIds?.includes(user.id))}
                                options={allUsers}
                                optionLabel="username"
                                onChange={v => setTaskData({ ...taskData, assigneeIds: v.value.map((user: User) => user.id) })}
                                itemTemplate={(option) => option && (
                                    <div className="flex items-center gap-2">
                                        <UserAvatar user={option} />
                                        <h2>{option.username}</h2>
                                    </div>
                                )}
                                className="w-60"
                            />
                            <label htmlFor="assignees-input">Assignés</label>
                        </FloatLabel>
                    </div>
                    <div className="w-full">
                        <MarkdownEditor
                            value={taskData.description || ""}
                            onChange={e => setTaskData({ ...taskData, description: e })}
                        />
                    </div>
                </div>
                {/* Right column: comments (only for existing tasks) */}
                {!isCreation && (
                    <KanbanCommentSection taskId={task.id} />
                )}
            </div>

        </Dialog>
    )
}