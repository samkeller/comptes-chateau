import { Dialog } from "primereact/dialog"
import KanbanColumn from "../../interfaces/kanban/KanbanColumn"
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { Button } from "primereact/button";
import { FloatLabel } from "primereact/floatlabel";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import KanbanService from "../../services/kanban/KanbanService";
import { SaveKanbanTaskDto } from "../../services/kanban/dto/SaveKanbanTaskDto";

export interface EditKanbanTaskDialogDTO {
    selectedColumn: KanbanColumn | null;
}
interface EditKanbanTaskDialogProps {
    columns: KanbanColumn[],
    datas: EditKanbanTaskDialogDTO,
    closeDialog: (reloadList: boolean) => void
}

export default function EditKanbanTaskDialog({ columns, datas, closeDialog }: EditKanbanTaskDialogProps) {
    const service = new KanbanService();
    const [formData, setFormData] = useState<SaveKanbanTaskDto>({
        columnId: datas.selectedColumn?.id || columns[0]?.id || 0,
        title: "",
    })

    async function handleSubmit() {
        service.saveKanbanTask(formData)
        closeDialog(true);
        console.log(formData);
    }

    const footer = (
        <div>
            <Button label="Annuler" icon="pi pi-times" className="p-button-text" onClick={() => closeDialog(false)} />
            {/* <Button label={formData.selectedColumn ? "Modifier" : "Ajouter"} icon="pi pi-check" onClick={handleSubmit} /> */}
            <Button label={"Ajouter"} icon="pi pi-check" onClick={handleSubmit} />
        </div>
    );

    return (
        <Dialog
            visible onHide={() => closeDialog(false)}
            style={{ width: '50vw' }}
            // header={formData.selectedColumn ? "Modifier la tâche" : "Ajouter une tâche"}
            footer={footer}
        >
            <div className="pt-4 flex flex-column gap-4">

                <FloatLabel>
                    <Dropdown
                        inputId="category-dropdown"
                        value={columns.find(c => c.id === formData.columnId) || null}
                        options={columns}
                        onChange={e => e.value && setFormData({ ...formData, columnId: e.value.id })}
                        optionLabel="label"
                    />
                    <label htmlFor="category-dropdown">Catégorie</label>
                </FloatLabel>

                <FloatLabel>
                    <InputText
                        id="title-input"
                        className="w-full"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <label htmlFor="title-input">Titre</label>
                </FloatLabel>
                <FloatLabel>
                    <InputTextarea
                        id="description-input"
                        className="w-full"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <label htmlFor="description-input">Description</label>
                </FloatLabel>
            </div>

        </Dialog>
    )
}