import { PageTemplate } from "../PageTemplate";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import RecurringExpenses from "./RecurringExpenses";

export default function Budget() {
    return (
        <PageTemplate pageTitle="Budget">
            <div className="flex gap-2 w-full">
                <div className="flex-1 min-w-0">
                    <MonthlyDashboard />
                </div>
                <div className="flex-1 min-w-0">
                    <RecurringExpenses />
                </div>
            </div>
        </PageTemplate>
    );
}