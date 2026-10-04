import { useState } from "react";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import KanbanTagDisplay from "./atoms/KanbanTagDisplay";
import { User } from "@/interfaces/User";
import UserAvatar from "@/components/atoms/UserAvatar";
import { useScreen } from "@/hooks/useScreen";

export interface KanbanFiltersData {
    users: User[];
    tags: string[];
    showDone: boolean;
}
interface KanbanFiltersProps {
    allUsers: User[];
    allTags: string[];
    filters: KanbanFiltersData;
    changeFilters(filters: KanbanFiltersData): void;
}

export default function KanbanFilters({ allUsers, allTags, filters, changeFilters }: KanbanFiltersProps) {
    const { isMobile } = useScreen();
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const activeFiltersCount = filters.tags.length + filters.users.length + (filters.showDone ? 1 : 0);

    return (
        <div className="flex w-full flex-col items-end gap-2">
            {isMobile && (
                <Button
                    label={activeFiltersCount > 0 ? `Filtres (${activeFiltersCount})` : "Filtres"}
                    icon="pi pi-filter"
                    outlined={!filtersExpanded}
                    size="small"
                    aria-expanded={filtersExpanded}
                    onClick={() => setFiltersExpanded((expanded) => !expanded)}
                />
            )}
            {(!isMobile || filtersExpanded) && (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <MultiSelect
                        value={filters.tags}
                        options={allTags}
                        onChange={(e) => changeFilters({ ...filters, tags: e.value })}
                        placeholder="Tags"
                        className="w-40"
                        itemTemplate={(option) => option && <KanbanTagDisplay tag={option} />}
                        selectedItemTemplate={(option) => option && <KanbanTagDisplay tag={option} />}
                    />
                    <MultiSelect
                        value={filters.users}
                        options={allUsers}
                        optionLabel="username"
                        onChange={(e) => changeFilters({ ...filters, users: e.value })}
                        placeholder="Assignés"
                        className="w-40"
                        itemTemplate={(option) => option && (
                            <div className="flex items-center gap-2">
                                <UserAvatar user={option} />
                                <h2>{option.username}</h2>
                            </div>
                        )}
                        selectedItemTemplate={(option) => option && <UserAvatar user={option} />}
                    />
                    <Button
                        {...(!isMobile && { label: "Afficher les terminées" })}
                        icon={filters.showDone ? "pi pi-check-circle" : "pi pi-circle"}
                        outlined={!filters.showDone}
                        size="small"
                        className="shrink-0"
                        onClick={() => changeFilters({ ...filters, showDone: !filters.showDone })}
                        {...(isMobile && { tooltip: "Afficher les terminées", tooltipOptions: { position: "bottom" } })}
                    />
                </div>
            )}
        </div>
    )
}