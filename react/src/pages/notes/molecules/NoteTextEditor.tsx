import MarkdownEditor from "@/components/form/markdown/MarkdownEditor";

interface NoteTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function NoteTextEditor({ value, onChange }: NoteTextEditorProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="font-medium">Contenu</label>
            <MarkdownEditor value={value} onChange={onChange} />
        </div>
    );
}
