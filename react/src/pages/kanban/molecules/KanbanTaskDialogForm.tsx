import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import KanbanColumn from "../../../interfaces/kanban/KanbanColumn";
import type { KanbanTaskPriority, CreateKanbanTaskRequest } from "@chocosous/shared";
import PriorityFlag, { getPriorityLabel } from "../atoms/PriorityFlag";
import MarkdownEditor from "../../../components/form/markdown/MarkdownEditor";
import { AutoComplete } from "primereact/autocomplete";
import KanbanTagDisplay from "../atoms/KanbanTagDisplay";
import { MultiSelect } from "primereact/multiselect";
import { User } from "../../../interfaces/User";
import UserAvatar from "@/components/atoms/UserAvatar";
import { SelectItem } from "primereact/selectitem";
import { useMemo, useState } from "react";
import { InputText } from "primereact/inputtext";
import { ScrollPanel } from "primereact/scrollpanel";



interface KanbanTaskDialogFormProps {
    taskData: CreateKanbanTaskRequest,
    setTaskData: (taskData: CreateKanbanTaskRequest) => void,
    allTags: string[],
    columns: KanbanColumn[],
    allUsers: User[],
}

export default function KanbanTaskDialogForm({ taskData, setTaskData, allTags, columns, allUsers }: KanbanTaskDialogFormProps) {

    const [tagSuggestions, setTagSuggestions] = useState<string[]>(allTags);

    const availableTags = useMemo(() => {
        const selectedTags = new Set(taskData.tags);

        return allTags.filter(tag => !selectedTags.has(tag));
    }, [allTags, taskData.tags]);


    /**
     * From KANBAN_TASK_PRIORITIES
     */
    const priorityOptions: SelectItem[] = [
        { value: "low", label: getPriorityLabel("low") },
        { value: "normal", label: getPriorityLabel("normal") },
        { value: "high", label: getPriorityLabel("high") },
    ]

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

    return (
        <ScrollPanel className="w-full h-full min-w-0 min-h-0">
            <div className="w-full min-w-0 flex flex-col gap-8 mt-8">
                <div className="flex flex-row gap-4 flex-wrap">
                    <FloatLabel className="flex-1">
                        <InputText
                            id="title-input"
                            value={taskData.title}
                            onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                            className="w-full"
                        />
                        <label htmlFor="title-input">Titre</label>
                    </FloatLabel>
                </div>
                <div className="flex flex-row gap-4 flex-wrap">
                    <FloatLabel className="flex-1">
                        <Dropdown
                            inputId="category-dropdown"
                            value={columns.find(c => c.id === taskData.columnId) || null}
                            options={columns}
                            onChange={e => e.value && setTaskData({ ...taskData, columnId: e.value.id })}
                            optionLabel="label"
                            className="w-full"
                        />
                        <label htmlFor="category-dropdown">Catégorie</label>
                    </FloatLabel>
                    <FloatLabel className="flex-1">
                        <Dropdown
                            inputId="priority-dropdown"
                            value={taskData.priority}
                            options={priorityOptions}
                            onChange={e => setTaskData({ ...taskData, priority: e.value as KanbanTaskPriority })}
                            optionLabel="label"
                            optionValue="value"
                            className="w-full"
                            itemTemplate={option => <PriorityFlag priority={option.value} />}
                            valueTemplate={option => option?.value && <PriorityFlag priority={option.value} />}
                        />
                        <label htmlFor="priority-dropdown">Priorité</label>
                    </FloatLabel>
                </div>
                <div className="flex flex-row gap-4 flex-wrap">
                    <FloatLabel className="flex-1">
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
                            pt={{

                                container: {
                                    className: "w-full flex"
                                },
                                inputToken: {
                                    className: "flex-1"
                                },
                            }}
                            className="w-full"
                        />
                        <label htmlFor="tags-input">Tags</label>
                    </FloatLabel>
                    <FloatLabel className="flex-1">
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
                            className="w-full"
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
        </ScrollPanel>
    )
}
