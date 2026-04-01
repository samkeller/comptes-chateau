import { useState } from "react";
import { Card } from "primereact/card";
import UserAvatar from "../../../components/atoms/UserAvatar";
import { User } from "../../../interfaces/User";

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
    "Optimisation en cours... veuillez patienter indéfiniment.",
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
    "beep boop beep boop // Analyse financière terminée : Gaelle a assez de sous pour acheter une Switch. Achat jugé soutenable par le robot-conseil."
];

interface HomeWelcomeCardProps {
    user: User;
}

export default function HomeWelcomeCard({ user }: HomeWelcomeCardProps) {
    const [randomQuote] = useState(() => inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)]);
    return (
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
    );
}
