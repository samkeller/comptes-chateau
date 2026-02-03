import { FilterMatchMode } from "primereact/api";
import { DataTableFilterMetaData } from "primereact/datatable";
import { toLocaleIsoString } from "../Utils/DatesUtils";

export default class LazyParser {

    /**
     * Traite les filtres de dates en fonction du mode de filtre sélectionné
     * @param dateValue La date du filtre
     * @param operator Le mode de filtre (DATE_IS, DATE_AFTER, DATE_BEFORE)
     * @returns Objet avec les clés 'from' et 'to' contenant les limites de plage
     */
    public static parseDateFilter(dateValue: string | Date, operator: DataTableFilterMetaData["matchMode"]): { from: Date; to: Date } {
        const d: Date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        const minDate = new Date(2010, 0, 1);
        const maxDate = new Date(2050, 0, 1);

        console.log("dateValue", d, toLocaleIsoString(d));
        switch (operator) {
            case FilterMatchMode.DATE_AFTER: {
                return { from: d, to: maxDate };
            }
            case FilterMatchMode.DATE_BEFORE: {
                // Jusqu'à 23:59:59.999 de cette date
                return { from: minDate, to: d }; // Min date
            }
            case FilterMatchMode.DATE_IS:
            default:
                // Par défaut, comportement DATE_IS
                // Inclure toute la journée
                return { from: d, to: d };
        }
    }
}