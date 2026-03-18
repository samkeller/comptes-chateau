import { useState } from "react";
import { Button } from "primereact/button";
import AccountingService from "../../services/AccountingService";
import { parseDateToDDMMYYYY } from "../../utils/DatesUtils";
import { useGlobalToast } from "../../context/GlobalToastContext";
import AccountLine from "../../interfaces/AccountLine";
import { exportToCsv, ExportRow } from "../../utils/ExportUtils";

interface AccountBookExportButtonsProps { }

export default function AccountBookExportButtons({ }: AccountBookExportButtonsProps) {
    const [accountingService] = useState(new AccountingService());
    const [isLoading, setIsLoading] = useState(false);
    const showGlobalToast = useGlobalToast();

    function getExportRows(lines: AccountLine[]): ExportRow[] {
        return lines.map((line) => ({
            "Date opération": line.dateOperation ? parseDateToDDMMYYYY(line.dateOperation) : null,
            "Date valeur": line.dateValeur ? parseDateToDDMMYYYY(line.dateValeur) : null,
            "Libellé": line.label,
            "Nature": line.nature?.label ?? "",
            "Poste": line.poste?.label ?? "",
            "Montant": line.total,
            "Vérifiée": line.isChecked,
            "Hors compte": line.isHorsCompte,
            "Source": line.source ?? ""
        }));
    }

    const exportLines = () => {
        setIsLoading(true);
        accountingService
            .getAllAccountLinesForExport()
            .then((lines) => {
                const rows = getExportRows(lines);
                exportToCsv("operations", rows);

                showGlobalToast({
                    severity: "success",
                    summary: "Export CSV prêt",
                    detail: `${lines.length} opération(s) exportée(s).`
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <>
            <Button
                label="Exporter CSV"
                icon="pi pi-download"
                outlined
                onClick={exportLines}
                loading={isLoading}
                disabled={isLoading}
            />
        </>
    );
}