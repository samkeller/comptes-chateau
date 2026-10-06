import { useId, useState, type ReactNode } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";

interface StockDetailsCardProps {
    title: string;
    summary: ReactNode;
    children: ReactNode;
    hasDetails: boolean;
}

export default function StockDetailsCard({ title, summary, children, hasDetails }: StockDetailsCardProps) {
    const [expanded, setExpanded] = useState(false);
    const detailsId = useId();

    return (
        <Card className="h-full" title={(
            <div className="flex items-center justify-between gap-2">
                <span>{title}</span>
                <Button
                    rounded text
                    icon={expanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                    aria-label={`${expanded ? "Masquer" : "Afficher"} le détail : ${title}`}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    disabled={!hasDetails}
                    onClick={() => setExpanded((value) => !value)}
                />
            </div>
        )}>
            <div id={detailsId}>
                {expanded && hasDetails ? children : summary}
            </div>
        </Card>
    );
}