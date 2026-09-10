import { Tag } from "primereact/tag";

export type ImportMatchStatus = "unique" | "choice-required" | "choice-selected";

interface ImportMatchStatusTagProps {
    status: ImportMatchStatus;
}

const STATUS_CONFIG: Record<ImportMatchStatus, { value: string; severity: "success" | "warning" | "info" }> = {
    unique: {
        value: "Correspondance unique",
        severity: "success"
    },
    "choice-required": {
        value: "Choix requis",
        severity: "warning"
    },
    "choice-selected": {
        value: "Choix sélectionné",
        severity: "info"
    }
};

export default function ImportMatchStatusTag({ status }: ImportMatchStatusTagProps) {
    const config = STATUS_CONFIG[status];

    return <Tag icon="pi pi-file-import" value={config.value} severity={config.severity} />;
}