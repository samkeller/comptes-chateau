import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLineRule from "@/interfaces/AccountLineRule";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";


interface AccountLineCategorizationDatatableProps {
    accountLineRules: AccountLineRule[];
}

// AccountLineRule
//     id: number = 0;
//     pattern: string = "";
//     posteId?: number = 0;
//     natureId?: number = 0;
//     poste?: AccountLinePoste;
//     nature?: AccountLineNature;



export default function AccountLineCategorizationDatatable({ accountLineRules }: AccountLineCategorizationDatatableProps) {


    return (
        <Card title="Déjà matchés">
            <DataTable
                value={accountLineRules}
            >
                <Column field="pattern" header="Pattern"></Column>
                <Column
                    field="poste"
                    header="Poste"
                    body={(rowData: AccountLineRule) => rowData.poste && <ColoredLabel data={{ label: rowData.poste.label, color: rowData.poste.color }} />}
                ></Column>
                <Column
                    field="nature"
                    header="Nature"
                    body={(rowData: AccountLineRule) => rowData.nature && <ColoredLabel data={{ label: rowData.nature.label, color: rowData.nature.color }} />}
                ></Column>
                <Column field="occurrencesCount" header="Occurences"></Column>
            </DataTable>
        </Card>

    )
}