import { useEffect, useMemo, useState } from "react";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { useConnectedUser } from "../../context/ConnectedUserContext";
import AccountService from "../../services/AccountService";
import DashboardService from "../../services/DashboardService";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import { PageTemplate } from "../PageTemplate";
import HomeGlobalActionsCard from "./components/HomeGlobalActionsCard";
import HomeWelcomeCard from "./components/HomeWelcomeCard";
import type { DashboardOverview } from "@chocosous/shared";
import Account from "@/interfaces/Account";
import AccountOverview from "./components/molecules/AccountOverview";

export interface AccountOverviewModel {
    account: Account;
    overview: DashboardOverview;
}

export default function Index() {
    const { connectedUser: user } = useConnectedUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [accountOverviews, setAccountOverviews] = useState<AccountOverviewModel[]>([]);

    useEffect(() => {
        let isMounted = true;

        const loadHomeData = async () => {
            setLoading(true);

            try {
                const accounts = await new AccountService().getAllAccounts();
                if (!isMounted) {
                    return;
                }

                if (accounts.length === 0) {
                    setAccountOverviews([]);
                    return;
                }

                const overviews = await Promise.all(
                    accounts.map(async (account) => ({
                        account,
                        overview: await new DashboardService().getAccountOverview(account.id)
                    }))
                );

                if (!isMounted) {
                    return;
                }

                setAccountOverviews(overviews);
            } catch {
                if (!isMounted) {
                    return;
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadHomeData();

        return () => {
            isMounted = false;
        };
    }, []);

    const assignedKanbanTasksCount = useMemo(
        () => accountOverviews[0]?.overview.assignedKanbanTasksCount ?? 0,
        [accountOverviews]
    );

    const totalCurrentBalance = useMemo(
        () => accountOverviews.reduce((acc, item) => acc + item.overview.currentBalance, 0),
        [accountOverviews]
    );

    const totalForecastBalanceMonthEnd = useMemo(
        () => accountOverviews.reduce((acc, item) => acc + item.overview.forecastBalanceMonthEnd, 0),
        [accountOverviews]
    );


    const totalForecastBalanceFinal = useMemo(
        () => accountOverviews.reduce((acc, item) => acc + item.overview.forecastBalanceFinal, 0),
        [accountOverviews]
    );

    const totalOperationsToCheck = useMemo(
        () => accountOverviews.reduce((acc, item) => acc + item.overview.operationsToCheckHorsCompteCount + item.overview.operationsToCheckInAccountCount, 0),
        [accountOverviews]
    );

    return (
        <PageTemplate pageTitle="Accueil">
            <div className="flex flex-col gap-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <>
                        {user && <HomeWelcomeCard user={user} />}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card title="Synthese" className="lg:col-span-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <div className="text-sm text-surface-500">Solde actuel</div>
                                        <div className="text-3xl font-bold text-surface-900">{toMonetaryAmount(totalCurrentBalance)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-surface-500">Solde prévisionnel (ce mois)</div>
                                        <div className="text-3xl font-bold text-surface-900">{toMonetaryAmount(totalForecastBalanceMonthEnd)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-surface-500">Solde prévisionnel (total)</div>
                                        <div className="text-3xl font-bold text-surface-900">{toMonetaryAmount(totalForecastBalanceFinal)}</div>
                                    </div>
                                </div>
                            </Card>

                            <HomeGlobalActionsCard
                                assignedKanbanTasksCount={assignedKanbanTasksCount}
                                totalOperationsToCheck={totalOperationsToCheck}
                            />
                        </div>
                        <Card title="Vue synthetique par compte">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {accountOverviews.map((model) => (
                                    <AccountOverview
                                        key={model.account.id}
                                        model={model}
                                    />
                                ))}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </PageTemplate>
    );
}