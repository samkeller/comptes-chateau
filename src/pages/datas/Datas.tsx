import { useRef } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { ParseBanquePostale } from '../../Utils/ParseBanquePostalUtils';

function Datas() {
    const toast = useRef<Toast>(null);

    const customBase64Uploader = async (event: FileUploadHandlerEvent) => {
        // convert file to base64 encoded
        const file = event.files[0];
        const reader = new FileReader();

        reader.onload = function (e: ProgressEvent<FileReader>) {
            const fileDatas = e.target?.result
            if (fileDatas) {
                const parsed = ParseBanquePostale(fileDatas.toString())
            }
        };
        reader.readAsText(file);
    }


    return (
        <div className="card flex justify-content-center">
            <Toast ref={toast}></Toast>
            <FileUpload
                mode="basic" accept="csv"
                maxFileSize={1000000}
                customUpload uploadHandler={customBase64Uploader}
            />
        </div>
    )
}

export default Datas