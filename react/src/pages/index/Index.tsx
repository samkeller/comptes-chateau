import { PageTemplate } from "../PageTemplate";
import { Card } from "primereact/card";
import { useEffect, useMemo, useState } from "react";
import DashboardService from "../../services/DashboardService";
import { DashboardOverview } from "../../interfaces/DashboardOverview";
import { ProgressSpinner } from "primereact/progressspinner";
import { toMonetaryAmount } from "../../utils/NumberUtils";
import MonthlyDashboard from "./monthlyDashboard/MonthlyDashboard";
import TooltipInfoIcon from "../../components/TooltipInfoIcon";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import UserService from "../../services/UserService";
import { User } from "../../interfaces/User";
import UserAvatar from "../../components/atoms/UserAvatar";
import { Divider } from "primereact/divider";

export default function Index() {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const loadOverview = async () => {
            try {
                setLoading(true);
                const data = await new DashboardService().getOverview();
                setOverview(data);
                const connectedUser = await new UserService().me()
                setUser(connectedUser)
            } finally {
                setLoading(false);
            }
        };

        loadOverview();
    }, []);

    const budgetProgress = useMemo(() => {
        if (!overview || overview.monthlyBudget <= 0) {
            return 0;
        }
        return Math.min(100, (overview.monthExpenses / overview.monthlyBudget) * 100);
    }, [overview]);

    const getBalanceClass = (value: number): string => {
        if (value < 0) return "text-red-500";
        if (value <= 100) return "text-orange-500";
        return "text-green-500";
    };

    const daysRemainingInMonth = useMemo(() => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.getDate() - today.getDate();
    }, []);

    const IndicatorCard = ({
        title,
        value,
        description,
        tooltipText,
        className
    }: {
        title: string;
        value: string;
        description: string,
        tooltipText: string,
        className?: string
    }) => (

        <Card
            title={<span className="flex content-center gap-2">
                {title}
                <TooltipInfoIcon tooltipText={tooltipText} />
            </span>}
            className="h-full"
        >
            <h2 className={`text-4xl font-bold ${className ?? ""}`} >
                {value}
            </h2>
            <div className="text-surface-500 mt-2">{description}</div>
        </Card>
    )

    const inspiringQuotes = [
        "Un budget équilibré est le reflet d'une vie équilibrée. Ou d'un mensonge bien tenu.",
        "Chaque euro compte. Surtout quand il disparaît.",
        "Les chocosous: là où l'amour rencontre les découverts.",
        "Je te mange",
        "Un café en moins, une illusion en plus.",
        "Investir, c'est croire très fort à des chiffres qui bougent.",
        "L'argent ne fait pas le bonheur, seul Toulouse & Berlioz le font.",
        "Un virement, deux regrets.",
        "Sam optimise. Gaëlle valide. Le compte tremble.",
        "Épargner aujourd'hui pour stresser différemment demain.",
        "Les petites dépenses n'existent pas. Juste des grosses accumulées.",
        "Budget prévisionnel: fiction réaliste.",
        "Un achat réfléchi est un achat reporté.",
        "La richesse, c'est relatif. Surtout sur ce compte.",
        "Chocochou approuve ce craquage.",
        "Rouge sur l'interface, conseil de famille dans ta façe.",
        "Les chocosous, parce que 'on verra' n'est pas une stratégie.",
        "Toulouse n'aurait pas validé cet achat.",
        "Berlioz aurait tout dépensé.",
        "L'équilibre financier est un état d'esprit, pas un état du compte.",
        "Dépense émotionnelle détectée.",
        "Objectif: finir le mois. Bonus: avec dignité.",
        "On ne perd pas d'argent, on apprend.",
        "Un budget, c'est comme un régime: ça marche mieux en théorie.",
        "Gaëlle avait raison. Encore.",
        "Sam avait une idée. Mauvaise.",
        "Les chocosous: suivre ses dépenses sans les juger (trop).",
        "Un clic, un achat, une remise en question.",
        "Optimisation en cours… veuillez patienter indéfiniment.",
        "Un solde positif est un état temporaire.",
        "Acheter moins, regretter différemment.",
        "Les chats n'ont jamais fait de découvert. Coïncidence ?",
        "Budget serré, créativité maximale.",
        "L'argent part, les souvenirs restent. Parfois.",
        "Vision long terme, dépenses court terme.",
        "Tout est sous contrôle. Techniquement.",
        "Les chocosous: parce que compter dans sa tête, c'est fini.",
        "Les chocosous: l'application qui monte malgré le silence des médias",
        "'Nocciolata' rime avec 'c'est pas pour toi', coincidence ?",
        "Todo: Ajouter un poste de dépense 'Sauce algerienne'",
    ];

    const [randomQuote] = useState(() => inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)]);
    return (
        <PageTemplate pageTitle="Dashboard">
            {loading && (
                <div className="flex justify-center p-12">
                    <ProgressSpinner />
                </div>
            )}

            {!loading && overview && (
                <div className="flex flex-col gap-6">
                    {/* Header: Username + Quote */}
                    {user && (
                        <Card className="overflow-hidden border-none">
                            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full ring-2 ring-primary-200 ring-offset-2 ring-offset-surface-0">
                                        <div className="h-8 w-8">
                                            <UserAvatar user={user} />
                                        </div>
                                    </div>
                                    <div>
                                        <small className="block text-surface-500">Content de te revoir</small>
                                        <h1 className="m-0 text-2xl font-semibold text-surface-900 md:text-3xl">{user.username}</h1>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-surface-200 bg-surface-0/85 px-4 py-3 shadow-sm backdrop-blur-sm md:max-w-xl">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-600">Citation du jour</span>
                                    <p className="m-0 leading-relaxed text-surface-700 italic">
                                        "{randomQuote}"
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Indicators & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Solde actuel & prévisionnel regroupés */}
                        <Card
                            title="Solde"
                            className="h-full"
                        >
                            <div className="flex h-full">
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">Actuel</span>
                                        <TooltipInfoIcon tooltipText="Prend en compte uniquement les opérations 'validées' dont les natures de dépenses sont liées au compte en banque. Représente l'état actuel du compte." />
                                    </div>
                                    <div className={`text-3xl font-bold ${getBalanceClass(overview.currentBalance)}`}>{toMonetaryAmount(overview.currentBalance)}</div>
                                    <div className="text-surface-500 text-sm">Opérations validées uniquement</div>
                                </div>
                                <Divider layout="vertical" className="shrink" />
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">Prévisionnel</span>
                                        <TooltipInfoIcon tooltipText="Prend en compte toutes les opérations (validées ou non) dont les natures de dépenses sont liées au compte en banque." />
                                    </div>
                                    <div className={`text-3xl font-bold ${getBalanceClass(overview.forecastBalance)}`}>{toMonetaryAmount(overview.forecastBalance)}</div>
                                    <div className="text-surface-500 text-sm">Toutes les opérations (validées + à venir)</div>
                                </div>
                            </div>
                        </Card>
                        {/* Dépenses du mois */}
                        <Card title="Dépenses du mois" className="h-full flex flex-col justify-between">
                            <div className="text-3xl font-bold text-surface-900">
                                {toMonetaryAmount(overview.monthExpenses)} / {toMonetaryAmount(overview.monthlyBudget)}
                            </div>
                            <div className="mt-6">
                                <div className="w-full bg-surface-200 rounded-border overflow-hidden" style={{ height: "0.7rem" }}>
                                    <div
                                        className="bg-primary text-primary-contrast"
                                        style={{ width: `${budgetProgress}%`, height: "100%" }}
                                    />
                                </div>
                            </div>
                            <div className="text-surface-500 mt-2">
                                {budgetProgress.toFixed(1)}% consommé • {daysRemainingInMonth} jour(s) restant(s)
                            </div>
                        </Card>
                        {/* Actions à faire regroupées */}
                        <Card
                            title="Actions à faire"
                            className="h-full"
                        >
                            {
                                overview.operationsToCheckInAccountCount === 0 &&
                                    overview.assignedKanbanTasksCount === 0 ? (
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <i className="pi pi-check-circle text-green-500 text-4xl" />
                                        <span className="text-surface-500 text-base">All done ! 😺</span>
                                    </div>
                                ) : (
                                    <>
                                        {
                                            overview.operationsToCheckInAccountCount !== 0 && (
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-bold text-primary-700">{overview.operationsToCheckInAccountCount}</span>
                                                            <small className="text-surface-500 text-base">opérations à vérifier sur le compte</small>
                                                        </div>
                                                        <small className="text-surface-500 ml-8">{overview.operationsToCheckHorsCompteCount} hors compte</small>
                                                    </div>
                                                    <Button
                                                        label="Vérifications"
                                                        icon="pi pi-arrow-right"
                                                        onClick={() => navigate("/comptes/verifications")}
                                                        outlined
                                                        className="p-button-sm"
                                                    />
                                                </div>
                                            )
                                        }
                                        {
                                            overview.operationsToCheckInAccountCount !== 0 &&
                                            <Divider className="shrink" />
                                        }
                                        {
                                            overview.assignedKanbanTasksCount !== 0 && (
                                                <div className="flex justify-between items-center">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-bold text-primary-700">{overview.assignedKanbanTasksCount}</span>
                                                            <small className="text-surface-500 text-base">tâches assignées</small>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        label="Kanban"
                                                        icon="pi pi-arrow-right"
                                                        onClick={() => navigate("/kanban")}
                                                        outlined
                                                        className="p-button-sm"
                                                    />
                                                </div>
                                            )
                                        }
                                    </>
                                )
                            }
                        </Card>


                    </div>
                    <MonthlyDashboard />
                </div>
            )
            }
        </PageTemplate >
    )
}