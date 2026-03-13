import { Tag } from "primereact/tag";
import { getNiceColorFromString } from "../../../utils/colorUtils";

interface KanbanTagDisplayProps {
    tag: string
}

export default function KanbanTagDisplay({ tag }: KanbanTagDisplayProps) {
    return (
        <Tag
            value={tag}
            style={{ borderColor: getNiceColorFromString(tag) }}
            className="border-2 rounded-lg"
        />
    );
}