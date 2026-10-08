import { Button } from "primereact/button";
import type { StockDashboardOverviewDto, StockExpiryState } from "@chocosous/shared";

interface StockOverviewBarProps {
    overview: StockDashboardOverviewDto | null;
    expiryFilter: StockExpiryState | null;
    onExpiryFilterChange: (state: StockExpiryState | null) => void;
}

/**
 * Bandeau compact des indicateurs, qui servent aussi de filtres.
 * Seuls les périmés et « bientôt périmés » non nuls sont colorés : une valeur à 0 reste neutre.
 */
export default function StockOverviewBar({ overview, expiryFilter, onExpiryFilterChange }: StockOverviewBarProps) {
    const chips: { state: StockExpiryState; label: string; count: number; severity: "danger" | "warning" }[] = [
        { state: "expired", label: "Périmés", count: overview?.expiredUnitCount ?? 0, severity: "danger" },
        { state: "soon", label: "Bientôt périmés", count: overview?.expiringSoonUnitCount ?? 0, severity: "warning" },
    ];

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between" role="group" aria-label="Indicateurs du stock">
            {overview && (
                <span className="text-sm text-surface-600">
                    <strong className="text-surface-900">{overview.stockUnitCount}</strong> exemplaire(s)
                    {" · "}{overview.inStockItemCount} produit(s)
                </span>
            )}
            <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
                const active = expiryFilter === chip.state;
                return (
                    <Button key={chip.state} size="small" className="shrink-0"
                        label={`${chip.label} · ${chip.count}`}
                        severity={chip.count > 0 ? chip.severity : "secondary"}
                        outlined={!active} aria-pressed={active}
                        disabled={chip.count === 0 && !active}
                        onClick={() => onExpiryFilterChange(active ? null : chip.state)} />
                );
            })}
            </div>
        </div>
    );
}
