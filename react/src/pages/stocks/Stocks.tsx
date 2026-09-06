import { PageTemplate } from "../PageTemplate";
import { TabPanel, TabView } from "primereact/tabview";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const tabs = [
    { label: "Gestion des stocks", path: "stocksManagement" },
    { label: "Gestion des produits", path: "productManagement" },
];

export default function Stocks() {
    const navigate = useNavigate();
    const location = useLocation();

    const activeIndex = tabs.findIndex((tab) => location.pathname.includes(`/stocks/${tab.path}`));

    return (
        <PageTemplate pageTitle="Stocks">
            <div className="flex flex-col w-full lg:h-full lg:min-h-0">
                <TabView
                    className="flex flex-col lg:h-full lg:min-h-0"
                    panelContainerClassName="lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col"
                    activeIndex={activeIndex === -1 ? 0 : activeIndex}
                    onTabChange={(event) => navigate(tabs[event.index].path)}
                >
                    {tabs.map((tab, index) => (
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
