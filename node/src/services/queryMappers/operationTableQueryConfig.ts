import { AccountingLine } from "../../entities/AccountingLine";
import {
    createBooleanSimpleFilterHandler,
    createComputedSortHandler,
    createDateSimpleFilterHandler,
    createNumericComparisonFilterHandler,
    createNumericEqualsSimpleFilterHandler,
    createOrderBySortHandler,
    createTextSimpleFilterHandler,
    TableQueryMapperConfig
} from "./TableQueryMapper";
import { parseApiDateString } from "../../utils/ApiDateUtils";

const AMOUNT_SQL = "(al.credit - al.debit)";

/**
 * Configuration de mapping tri/filtre pour l'entite AccountingLine.
 */
const operationTableQueryConfig: TableQueryMapperConfig<AccountingLine> = {
    defaultSort: {
        field: "dateOperation",
        direction: "DESC"
    },
    sortHandlers: {
        dateOperation: createOrderBySortHandler("al.dateOperation", "al.id"),
        dateValeur: createOrderBySortHandler("al.dateValeur", "al.id"),
        label: createOrderBySortHandler("al.label", "al.id"),
        "nature.label": createOrderBySortHandler("nature.label", "al.id"),
        "poste.label": createOrderBySortHandler("poste.label", "al.id"),
        isChecked: createOrderBySortHandler("al.isChecked", "al.id"),
        amount: createComputedSortHandler(AMOUNT_SQL, "amount_sort", "al.id")
    },
    filterHandlers: {
        dateOperation: createDateSimpleFilterHandler("al.dateOperation", parseApiDateString, "dateOperation"),
        dateValeur: createDateSimpleFilterHandler("al.dateValeur", parseApiDateString, "dateValeur"),
        label: createTextSimpleFilterHandler("al.label", "label"),
        "nature.label": createNumericEqualsSimpleFilterHandler("nature.id", "natureId"),
        "poste.label": createNumericEqualsSimpleFilterHandler("poste.id", "posteId"),
        isChecked: createBooleanSimpleFilterHandler("al.isChecked", "isChecked"),
        amount: createNumericComparisonFilterHandler(AMOUNT_SQL, "amount")
    }
};

export default operationTableQueryConfig;
