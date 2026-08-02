import { Dialog } from "primereact/dialog";
import changelog from "@assets/CHANGELOG.md?raw";
import { MarkdownRenderer } from "./atoms/MarkdownRenderer";

interface ChangelogDialogProps {
    hideDialog: () => void;
}

export default function ChangelogDialog({ hideDialog }: ChangelogDialogProps) {

    return (
        <Dialog
            visible={true} onHide={hideDialog}
            header={`Changelog`}
            className="w-[50vw]"
            modal
            dismissableMask
        >
            <MarkdownRenderer
                skipHtml
            >{changelog}
            </MarkdownRenderer>
        </Dialog>
    );
}
