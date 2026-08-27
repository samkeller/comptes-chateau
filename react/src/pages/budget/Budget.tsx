import { PageTemplate } from "../PageTemplate";
import { TabPanel, TabView } from "primereact/tabview";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const tabs = [
    { label: "Budget global", path: "overview" },
    { label: "Dépenses récurrentes", path: "recurringExpenses" },
    { label: "Lignes de budget", path: "budgetLines" },
];

export default function Budget() {
    const navigate = useNavigate();
    const location = useLocation();

    const activeIndex = tabs.findIndex((tab) => location.pathname.includes(`/budget/${tab.path}`));

    return (
        <PageTemplate pageTitle="Budget">
            <div className="flex flex-col w-full">
                <TabView
                    activeIndex={activeIndex === -1 ? 0 : activeIndex}
                    onTabChange={(event) => navigate(tabs[event.index].path)}
                >
                    {tabs.map((tab, index) => (
                        <TabPanel key={tab.path} header={tab.label}>
                            {index === (activeIndex === -1 ? 0 : activeIndex) && <Outlet />}
                        </TabPanel>
                    ))}
                </TabView>
            </div>
        </PageTemplate>
    );
}