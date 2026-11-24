import { notificationsDemo } from "./notificationsDemo";
import type { Scenario } from "./Scenario";

/**
 * Scénarios disponibles via `npm run seed`.
 * Nouveau scénario : un fichier dans ce dossier qui implémente `Scenario`, ajouté ici.
 */
export const scenarios: Scenario[] = [
    notificationsDemo,
];
