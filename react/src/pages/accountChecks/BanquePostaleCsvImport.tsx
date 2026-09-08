import { useRef } from "react";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { BanquePostaleCsvData } from "@chocosous/shared";
import { parseBanquePostaleCsv } from "../../utils/banquePostaleCsvParser";
import BanquePostaleService from "@/services/BanquePostaleService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";

interface BanquePostaleCsvImportProps {
    disabled?: boolean;
    onImport: (csvData: BanquePostaleCsvData) => void;
    onImportStart?: () => void;
}

const banquePostaleService = new BanquePostaleService();
const localStorageUtils = new LocalStorageUtils()

export default function BanquePostaleCsvImport({ disabled = false, onImport, onImportStart }: BanquePostaleCsvImportProps) {
    const fileUploadRef = useRef<FileUpload>(null);

    const customUploader = async (event: FileUploadHandlerEvent) => {
        
        onImportStart?.();
        
        try {   
        const fileCandidate = event.files?.[0];
        if (!fileCandidate) {
            fileUploadRef.current?.clear();
            throw new Error("Aucun fichier CSV selectionne.");
        }
        const csvBuffer = await fileCandidate.arrayBuffer();

        const parsedCsv = parseBanquePostaleCsv(csvBuffer);
        const storedId = localStorageUtils.getActiveAccountId();

        if (!storedId) {
            fileUploadRef.current?.clear();
            throw new Error("Aucun compte actif n'est selectionne.");
        }

        await banquePostaleService.import(storedId, parsedCsv);

        onImport(parsedCsv);
        } catch (error) {
            fileUploadRef.current?.clear();
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <FileUpload
                ref={fileUploadRef}
                mode="basic"
                accept=".csv,text/csv"
                maxFileSize={2_000_000}
                customUpload
                auto
                uploadHandler={customUploader}
                disabled={disabled}
                chooseLabel="Importer un releve Banque Postale (CSV)"
            />
        </div>
    );
}
