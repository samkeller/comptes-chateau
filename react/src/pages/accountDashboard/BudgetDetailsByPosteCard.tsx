import { Card } from "primereact/card";
import { useMemo } from "react";
import { BudgetByPoste } from "@/interfaces/BudgetByPoste";
import BudgetPosteRow from "./molecules/BudgetPosteRow";

interface BudgetVsActualCardProps {
    budgetData: BudgetByPoste[]
}

export default function BudgetDetailsByPosteCard({ budgetData }: BudgetVsActualCardProps) {


    const monthLabel = useMemo(() => {
        const label = new Date().toLocaleString("fr-FR", { month: "long" });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, []);


    return (
        <Card title={`Dépenses par poste (${monthLabel})`}>

          

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
