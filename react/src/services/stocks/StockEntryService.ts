import axios from "axios";
import { type SaveStockEntryDto, type StockItemWithLotsDto, type StockLotDto, type StockUnitUnits } from "@chocosous/shared";
import { formatApiDate } from "@/utils/DatesUtils";
import BaseService from "../BaseService";

export interface StockLotInlineChanges {
    copies?: number;
    locationId?: number;
    quantity?: number;
    unit?: StockUnitUnits;
    expirationDate?: Date | null;
}

export default class StockEntryService extends BaseService {
    /** Enregistre un produit et ses lots en une seule transaction (création ou modification). */
    async save(entry: SaveStockEntryDto): Promise<StockItemWithLotsDto> {
        const response = await axios.post<StockItemWithLotsDto>(`${this.apiUrl}/stocks/entries`, entry);
        return response.data;
    }

    /** Ajoute un exemplaire identique sans modifier les autres lots. */
    duplicateLot(item: StockItemWithLotsDto, lot: StockLotDto): Promise<StockItemWithLotsDto> {
        return this.editLot(item, { ...lot, unitIds: [] }, { copies: 1 });
    }

    /** Corrige les exemplaires cités; augmenter/réduire copies en ajoute/retire. */
    editLot(item: StockItemWithLotsDto, lot: StockLotDto, changes: StockLotInlineChanges): Promise<StockItemWithLotsDto> {
        const expirationDate = changes.expirationDate === undefined
            ? lot.expirationDate
            : changes.expirationDate === null ? null : formatApiDate(changes.expirationDate);
        return this.save({
            item: {
                id: item.id,
                label: item.label,
                defaultUnit: item.defaultUnit as StockUnitUnits
            },
            lots: [{
                unitIds: lot.unitIds,
                copies: changes.copies ?? lot.unitIds.length,
                locationId: changes.locationId ?? lot.locationId,
                quantity: changes.quantity ?? lot.quantity,
                unit: changes.unit ?? lot.unit as StockUnitUnits,
                expirationDate,
            }],
        });
    }
}
