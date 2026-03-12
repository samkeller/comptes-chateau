import { Message } from "primereact/message";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Accordion, AccordionTab } from "primereact/accordion";
import { parseDateToDDMMYYYY } from "../../utils/DatesUtils";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import {
    BanquePostaleImportAppliedMatch,
    BanquePostaleImportAmbiguity,
    BanquePostaleImportReport
} from "./banquePostaleImportMatching";
import { Button } from "primereact/button";

interface BanquePostaleImportReportPanelProps {
    report: BanquePostaleImportReport,
    close: () => void;
}

export default function BanquePostaleImportReportPanel({ report, close }: BanquePostaleImportReportPanelProps) {
    const appliedCount = report.appliedMatches.length;
    const ambiguityCount = report.ambiguities.length;

    return (
        <div className="flex flex-col gap-6 bg-surface-100 border border-surface rounded-border p-6 shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <h3>Résultat import CSV - {report.csvOperationCount} operation(s) lue(s)</h3>
                    <Message severity={appliedCount > 0 ? "success" : "warn"} text={`${appliedCount} operation(s) pre-remplie(s)`} />
                </div>
                <Button
                    icon="pi pi-times"
                    className="p-button-rounded p-button-text p-button-plain ml-auto"
                    tooltip="Fermer le rapport"
                    tooltipOptions={{position: "left"}}
                    onClick={close}
                />
            </div>

            <Accordion multiple>
                <AccordionTab header={`Operations pre-remplies (${appliedCount})`}>
                    <DataTable value={report.appliedMatches} size="small" emptyMessage="Aucune operation pre-remplie.">
                        <Column field="operationId" header="Operation" style={{ width: "8rem" }} />
                        <Column
                            header="Montant"
                            body={(row: BanquePostaleImportAppliedMatch) => toMonetaryAmount(row.amount)}
                            style={{ width: "10rem" }}
                        />
                        <Column
                            header="Date valeur appliquee"
                            body={(row: BanquePostaleImportAppliedMatch) => parseDateToDDMMYYYY(row.csvDateOperation)}
                            style={{ width: "12rem" }}
                        />
                    </DataTable>
                </AccordionTab>

                {ambiguityCount > 0 && (
                    <AccordionTab header={`Montants ambigus (${ambiguityCount})`}>
                        <DataTable value={report.ambiguities} size="small" emptyMessage="Aucune ambiguite.">
                            <Column
                                header="Montant"
                                body={(row: BanquePostaleImportAmbiguity) => toMonetaryAmount(row.amount)}
                                style={{ width: "10rem" }}
                            />
                            <Column field="csvCount" header="Occurrences CSV" style={{ width: "10rem" }} />
                            <Column field="operationCount" header="Operations dans la liste" style={{ width: "12rem" }} />
                            <Column
                                header="Action"
                                body={() => "Verification manuelle requise"}
                                style={{ width: "16rem" }}
                            />
                        </DataTable>
                    </AccordionTab>
                )}
            </Accordion>
        </div>
    );
}
