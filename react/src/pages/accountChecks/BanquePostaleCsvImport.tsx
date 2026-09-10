import { useRef, useState } from "react";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Button } from "primereact/button";
import { parseBanquePostaleCsv } from "../../utils/banquePostaleCsvParser";
import BanquePostaleService from "@/services/BanquePostaleService";
import BanquePostaleImportResult from "@/interfaces/Externals/BanquePostaleImportResult";
import { useGlobalToast } from "@/context/GlobalToastContext";

interface BanquePostaleCsvImportProps {
    accountId: number;
    disabled?: boolean;
    afterImportResults?: (results: BanquePostaleImportResult) => void;
}

const banquePostaleService = new BanquePostaleService();

export default function BanquePostaleCsvImport({ accountId, afterImportResults, disabled }: BanquePostaleCsvImportProps) {
    const [loading, setLoading] = useState(false);
    const fileUploadRef = useRef<FileUpload>(null);
    const showGlobalToast = useGlobalToast();

    const customUploader = async (event: FileUploadHandlerEvent) => {
        try {
            setLoading(true);
            let parsedCsv;
            try {
                const fileCandidate = event.files?.[0];
                if (!fileCandidate) {
                    throw new Error("Aucun fichier CSV selectionne.");
                }
                const csvBuffer = await fileCandidate.arrayBuffer();
                parsedCsv = parseBanquePostaleCsv(csvBuffer);
            } catch (error) {
                console.error("Erreur pendant l'import CSV Banque Postale", error);
                showGlobalToast({
                    severity: "error",
                    summary: "Import impossible",
                    detail: "Le fichier CSV est invalide ou non conforme au format Banque Postale."
                });
                return;
            }
            const results = await banquePostaleService.import(accountId, parsedCsv);

            afterImportResults?.(results);
        } finally {
            fileUploadRef.current?.clear();
            setLoading(false);
        }
    };

    if (loading) {
        return <Button label="Import en cours" icon="pi pi-spin pi-spinner" disabled outlined />;
    }

    return <FileUpload
        ref={fileUploadRef}
        mode="basic"
        accept=".csv,text/csv"
        maxFileSize={2_000_000}
        customUpload
        auto
        disabled={disabled}
        uploadHandler={customUploader}
        chooseOptions={{
            label: "Importer un relevé",
            icon: "pi pi-file-import",
            className: "p-button-outlined p-button-secondary"
        }}
    />;
}
