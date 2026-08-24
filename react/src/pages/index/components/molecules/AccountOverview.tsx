import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { generatePath, useNavigate } from "react-router-dom";
import { AccountOverviewModel } from "../../Index";
import { routePaths } from "@/routes/routePaths";

interface AccountOverviewProps {
    model: AccountOverviewModel;
}

export default function AccountOverview({ model }: AccountOverviewProps) {
    const { account, overview } = model;

    const hasForecastDelta = overview.currentBalance !== overview.forecastBalanceFinal;
    const localStorageUtils = new LocalStorageUtils();
    const operationsCount = overview.operationsToCheckInAccountCount;
    const horsCompteCount = overview.operationsToCheckHorsCompteCount;
    const budgetProgress = overview.monthlyBudget <= 0
        ? 0
        : Math.min(100, (overview.monthExpenses / overview.monthlyBudget) * 100);
    const navigate = useNavigate();

    const navigateToAccount = (accountId: number, path: "dashboard" | "accountChecks") => {
        localStorageUtils.setActiveAccountId(accountId);
        const paths = {
            dashboard: routePaths.account.dashboard,
            accountChecks: routePaths.account.accountChecks,
        } as const;
        navigate(generatePath(paths[path], { accountId: String(accountId) }));
    };

    return (
        <div className={`rounded-lg border p-4 border-surface-200`}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="m-0 text-lg font-semibold">{account.label}</h3>
                </div>
                <Button
                    label="Voir"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    text
                    onClick={() => navigateToAccount(account.id, "dashboard")}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-surface-0/70 p-3">
                    <div className="text-xs">Solde</div>
                    <div className="text-xl font-bold">{toMonetaryAmount(overview.currentBalance)}</div>
                </div>

                {
                    operationsCount > 0 && (

                        <div className="rounded-lg bg-surface-0/70 p-3">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div>
                                    <div className="font-bold"><small>Opérations à valider : </small>{operationsCount}</div>
                                    <div>
                                        {horsCompteCount > 0 && <small>{horsCompteCount} hors compte</small>}
                                        {hasForecastDelta && (
                                            <small className=" block">
                                                (Solde prévisionnel: <span className="font-semibold">{toMonetaryAmount(overview.forecastBalanceFinal)}</span>)
                                            </small>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        label="Vérifications"
                                        icon="pi pi-arrow-right"
                                        iconPos="right"
                                        size="small"
                                        text
                                        severity="warning"
                                        onClick={() => navigateToAccount(account.id, "accountChecks")}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

            </div>
            <div className="mt-3 flex items-center gap-3">
                <ProgressBar
                    value={Math.min(100, budgetProgress)}
                    displayValueTemplate={() => null}
                    className="h-2 flex-1"
                    pt={budgetProgress >= 100 ? { value: { style: { backgroundColor: "var(--red-400)" } } } : undefined}
                />
                <span className={`shrink-0 text-sm whitespace-nowrap ${budgetProgress >= 100 ? "text-red-400 font-semibold" : "text-surface-600"}`}>
                    {toMonetaryAmount(overview.monthExpenses)} / {toMonetaryAmount(overview.monthlyBudget)}
                    {budgetProgress >= 100 && <i className="pi pi-exclamation-triangle ml-1" />}
                </span>
            </div>
        </div>
    );
}