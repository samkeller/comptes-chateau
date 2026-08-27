import StockLocation from "./StockLocation";
import { parseApiDate, parseApiDateTime } from "@/utils/DatesUtils";

export default class StockItem {
    id: number = 0;
    label: string = "";
    barcode: string | null = null;
    currentQuantity: number = 0;
    unit: string = "";
    locationId: number = 0;
    location: StockLocation = new StockLocation({});
    expirationDate: Date | null = null;
    imageUrl: string | null = null;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(partial: Partial<StockItem>) {
        Object.assign(this, partial);
        this.location = partial.location ? new StockLocation(partial.location) : new StockLocation({});
        // Convertir les dates ISO en objets Date
        if(partial.expirationDate) {
            this.expirationDate = parseApiDate(partial.expirationDate) ?? null;
        }
        if (partial.createdAt) {
            this.createdAt = parseApiDateTime(partial.createdAt) ?? undefined;
        }
        if (partial.updatedAt) {
            this.updatedAt = parseApiDateTime(partial.updatedAt) ?? undefined;  
        }
    }
}
