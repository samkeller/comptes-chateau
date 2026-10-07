import { PageTemplate } from "../PageTemplate";
import { TabPanel, TabView } from "primereact/tabview";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import StockExpiringItemsList from "./molecules/StockExpiringItemsList";
import LastStockMovements from "./molecules/LastStockMovements";
import StocksMetrics from "./molecules/StocksMetrics";
import { useScreen } from "@/hooks/useScreen";

const tabs = [
    { label: "Gestion des stocks", path: "stocksManagement" },
    { label: "Gestion des produits", path: "productManagement" },
];


export default function Stocks() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDesktop } = useScreen();
    const visibleTabs = !isDesktop
        ? [...tabs, { label: "Scan rapide", path: "scan" }]
        : tabs;

    const activeIndex = visibleTabs.findIndex((tab) => location.pathname.includes(`/stocks/${tab.path}`));

    return (
        <PageTemplate pageTitle="Stocks">
            <div className="flex flex-col-reverse md:flex-col w-full lg:h-full lg:min-h-0 gap-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div className="w-full md:flex-1 md:min-w-0">
                        <StocksMetrics />
                    </div>
                    <div className="w-full md:flex-1 md:min-w-0">
                        <LastStockMovements />
                    </div>
                    <div className="w-full md:flex-1 md:min-w-0">
                        <StockExpiringItemsList />
                    </div>
                </div>
                <TabView
                    className="flex flex-col lg:h-full lg:min-h-0"
                    panelContainerClassName="lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col"
                    activeIndex={activeIndex === -1 ? 0 : activeIndex}
                    onTabChange={(event) => navigate(visibleTabs[event.index].path)}
                >
                    {visibleTabs.map((tab, index) => (
                        <TabPanel
                            key={tab.path}
                            header={tab.label}
                            contentClassName="lg:flex lg:h-full lg:min-h-0 lg:flex-col"
                        >
                            {index === (activeIndex === -1 ? 0 : activeIndex) && <Outlet />}
                        </TabPanel>
                    ))}
                </TabView>
            </div>
        </PageTemplate>
    );
}
