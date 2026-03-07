import { useRef } from "react";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { parseBanquePostaleCsv, BanquePostaleCsvData } from "../../utils/banquePostaleCsv";

interface BanquePostaleCsvImportProps {
    disabled?: boolean;
    onImport: (csvData: BanquePostaleCsvData) => void;
    onError: (message: string) => void;
    onImportStart?: () => void;
}

export default function BanquePostaleCsvImport({ disabled = false, onImport, onError, onImportStart }: BanquePostaleCsvImportProps) {
    const fileUploadRef = useRef<FileUpload>(null);

    const customUploader = async (event: FileUploadHandlerEvent) => {
        onImportStart?.();

        try {
            const fileCandidate = event.files?.[0];
            if (!fileCandidate) {
                onError("Aucun fichier CSV selectionne.");
                fileUploadRef.current?.clear();
                return;
            }

            const csvBuffer = await fileCandidate.arrayBuffer();
            const parsedCsv = parseBanquePostaleCsv(csvBuffer);
            onImport(parsedCsv);
        } catch (error) {
            console.error("Erreur pendant l'import CSV Banque Postale", error);
            onError("Le fichier CSV est invalide ou non conforme au format Banque Postale.");
        } finally {
            // Reset selection so re-importing the same file triggers the upload flow again.
            fileUploadRef.current?.clear();
        }
    };

    return (
        <div className="flex flex-column gap-2">
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
