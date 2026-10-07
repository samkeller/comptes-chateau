import { parseApiDate, parseApiDateTime } from "@/utils/DatesUtils";
import StockItem from "./StockItem";
import StockLocation from "./StockLocation";
import { getStockSeverity, type StockSeverity } from "@/utils/stocks/StockSeverity";
import type { StockUnitUnits } from "@chocosous/shared";

export { STOCK_UNIT_UNITS, type StockUnitUnits } from "@chocosous/shared";

export default class StockUnit {
    id: number = 0;
    itemId: number = 0;
    item: StockItem = new StockItem({});
    locationId: number = 0;
    location: StockLocation = new StockLocation({});

    quantity: number = 0;
    unit: StockUnitUnits = "g";

    expirationDate: Date | null = null;

    createdAt?: Date;
    updatedAt?: Date;

    constructor(partial: Partial<StockUnit>) {
        Object.assign(this, partial);

        this.item = partial.item ? new StockItem(partial.item) : new StockItem({});
        this.location = partial.location ? new StockLocation(partial.location) : new StockLocation({});

        if (partial.expirationDate) this.expirationDate = parseApiDate(partial.expirationDate) ?? null;
        if (partial.createdAt) this.createdAt = parseApiDateTime(partial.createdAt) ?? undefined;
        if (partial.updatedAt) this.updatedAt = parseApiDateTime(partial.updatedAt) ?? undefined;
    }

    public get severity(): StockSeverity {
        return getStockSeverity(this.expirationDate);
    }
}
