import { PageTemplate } from "../PageTemplate";
import RecurringExpenses from "./RecurringExpenses";
import BudgetItemsTable from "./BudgetItemsTable";
import { Message } from "primereact/message";

export default function Budget() {
    return (
        <PageTemplate pageTitle="Budget">
            <div className="flex flex-column gap-3 w-full">
                <Message
                    severity="info"
                    text="Note: le budget mensuel et les dépenses récurrentes sont affichés côte à côte mais restent indépendants pour l'instant."
                />

                <div className="flex gap-2 w-full">
                    <div className="flex-1 min-w-0">
                        <BudgetItemsTable />
                    </div>
                    <div className="flex-1 min-w-0">
                        <RecurringExpenses />
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}