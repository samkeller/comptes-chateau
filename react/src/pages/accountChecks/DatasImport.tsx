import { useRef } from "react";
import { Toast } from "primereact/toast";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";

export default function DatasImport() {
    const toast = useRef<Toast>(null);

    const customBase64Uploader = async (event: FileUploadHandlerEvent) => {
        const { files } = event;
        console.log(files);
    };

    return (
        <div className="card flex flex-column gap-2">
            <span>
                Import CSV BP <small>(Désactivé)</small>
            </span>
            <Toast ref={toast} />
            <FileUpload
                mode="basic"
                accept="csv"
                maxFileSize={1000000}
                customUpload
                uploadHandler={customBase64Uploader}
                disabled
            />
        </div>
    );
}
