import { Card } from "primereact/card";
import { PageTemplate } from "../PageTemplate";
import RecurringExpenses from "./RecurringExpenses";

export default function Budget() {


    return (
        <PageTemplate pageTitle="Budget">
            <div className="flex gap-2 w-full">
                <Card className="flex-1">

                </Card>
                <RecurringExpenses />
            </div>
        </PageTemplate>
    );
}