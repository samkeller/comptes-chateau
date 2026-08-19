import { Dialog } from "primereact/dialog";
import changelog from "@assets/CHANGELOG.md?raw";
import { MarkdownRenderer } from "./atoms/MarkdownRenderer";
import Sprite from "./atoms/Sprite/Sprite";

interface ChangelogDialogProps {
    hideDialog: () => void;
}

export default function ChangelogDialog({ hideDialog }: ChangelogDialogProps) {

    return (
        <Dialog
            visible={true} onHide={hideDialog}
            header={
                <div className="flex items-center gap-2">
                    <Sprite catVariant="toulouse" actionVariant="sleep2LeftFront" />
                    <h2>Changelog</h2>
                </div>
            }
            className="w-[95vw] sm:w-[80vw] md:w-[60vw] lg:w-[50vw]"
            modal
            dismissableMask
        >
            <MarkdownRenderer>{changelog}</MarkdownRenderer>
        </Dialog>
    );
}
