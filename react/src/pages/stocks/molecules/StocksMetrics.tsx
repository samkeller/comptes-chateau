import { Card } from "primereact/card";
import { useEffect, useState } from "react";
import type { StockDashboardOverviewDto } from "@chocosous/shared";
import StockDashboardService from "@/services/stocks/StockDashboardService";

const stockDashboardService = new StockDashboardService();

export default function StocksMetrics() {
    const [overview, setOverview] = useState<StockDashboardOverviewDto | null>(null);

    useEffect(() => {
        stockDashboardService.getOverview().then((data) => setOverview(data));
    }, []);

    return (
        <Card title="Vue d'ensemble" className="h-full">
            {overview && (
                <>
                    {overview.stockUnitCount === 0 && <div className="text-500 mb-3">Aucun lot en stock.</div>}
                    <dl className="grid grid-cols-2 gap-4 m-0">
                        <div>
                            <dt className="text-500 text-sm">Produits en stock</dt>
                            <dd className="text-2xl font-semibold m-0">{overview.inStockItemCount}</dd>
                        </div>
                        <div>
                            <dt className="text-500 text-sm">Lots disponibles</dt>
                            <dd className="text-2xl font-semibold m-0">{overview.stockUnitCount}</dd>
                        </div>
                        <div>
                            <dt className="text-500 text-sm">Lots avec une date de péremption</dt>
                            <dd className="text-2xl font-semibold m-0">{overview.datedUnitCount}</dd>
                        </div>
                        <div>
                            <dt className="text-500 text-sm">Expirent sous 30 jours</dt>
                            <dd className="text-2xl font-semibold text-orange-500 m-0">{overview.expiringSoonUnitCount}</dd>
                        </div>
                    </dl>
                </>
            )}
        </Card>
    );
}