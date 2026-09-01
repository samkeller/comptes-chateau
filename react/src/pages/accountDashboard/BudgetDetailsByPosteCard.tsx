import { Card } from "primereact/card";
import type { BudgetByPoste } from "@chocosous/shared";
import BudgetPosteRow from "./molecules/BudgetPosteRow";

interface BudgetVsActualCardProps {
    budgetData: BudgetByPoste[]
}

export default function BudgetDetailsByPosteCard({ budgetData }: BudgetVsActualCardProps) {
    return (
        <Card title={`Dépenses par poste`}>
            {budgetData.length > 0 && (
                <div className="flex flex-col gap-3">
                    {budgetData.map((row) => (
                        <BudgetPosteRow key={row.posteId} row={row} />
                    ))}
                </div>
            )}
        </Card>
    );
}
