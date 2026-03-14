import { MultiSelect } from "primereact/multiselect";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";
import { User } from "@/interfaces/User";
import UserAvatar from "@/components/atoms/UserAvatar";

export interface KanbanFiltersData {
    users: User[],
    tags: string[]
}
interface KanbanFiltersProps {
    allUsers: User[];
    allTags: string[];
    filters: KanbanFiltersData;
    changeFilters(filters: KanbanFiltersData): void;
}

export default function KanbanFilters({ allUsers, allTags, filters, changeFilters }: KanbanFiltersProps) {

    return (
        <div className="flex items-center justify-end gap-2">
            <MultiSelect
                value={filters.tags}
                options={allTags}
                onChange={(e) => changeFilters({ ...filters, tags: e.value })}
                placeholder="Tags"
                className="w-60"
                itemTemplate={(option) => option && <KanbanTagDisplay tag={option} />}
                selectedItemTemplate={(option) => option && <KanbanTagDisplay tag={option} />}
            />
            <MultiSelect
                value={filters.users}
                options={allUsers}
                optionLabel="username"
                onChange={(e) => changeFilters({ ...filters, users: e.value })}
                placeholder="Assignés"
                className="w-60"
                itemTemplate={(option) => option && (
                    <div className="flex items-center gap-2">
                        <UserAvatar user={option} />
                        <h2>{option.username}</h2>
                    </div>
                )}
                selectedItemTemplate={(option) => option && <UserAvatar user={option} />}
            />
            <i className="pi pi-filter" />
        </div>
    )
}