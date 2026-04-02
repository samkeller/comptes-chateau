import { PageTemplate } from "../PageTemplate";
import RecurringExpenses from "./recurringExpenses/RecurringExpenses";
import BudgetItemsTable from "./BudgetItemsTable";
import UnifiedBudgetView from "./UnifiedBudgetView";
import { useAccountId } from "../../hooks/useAccountId";
import { TabPanel, TabView } from "primereact/tabview";

export default function Budget() {
    const accountId = useAccountId();


    const panel = ({
        title,
        children
    }: { title: string; children: React.ReactNode }) => {
        return (
            <TabPanel header={title}>
                <div className="p-2">
                    {children}
                </div>
            </TabPanel>
        )
    }

    return (
        <PageTemplate pageTitle="Budget">
            <div className="flex flex-col gap-6 w-full">
                <TabView>
                    {panel({
                        title: "Budget global",
                        children: <UnifiedBudgetView accountId={accountId} />
                    })}
                    {
                        panel({
                            title: "Dépenses récurrentes",
                            children: <RecurringExpenses accountId={accountId} />
                        })
                    }
                    {
                        panel({
                            title: "Lignes de budget",
                            children: <BudgetItemsTable accountId={accountId} />
                        })
                    }
                </TabView>
            </div>
        </PageTemplate>
    );
}