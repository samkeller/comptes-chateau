import StockLocation from "./StockLocation";

export default class StockItem {
    id: number = 0;
    label: string = "";
    barcode: string | null = null;
    currentQuantity: number = 0;
    unit: string = "";
    locationId: number = 0;
    location: StockLocation = new StockLocation({});
    expirationDate: string | null = null;
    imageUrl: string | null = null;
    createdAt: string = "";
    updatedAt: string = "";

    constructor(partial: Partial<StockItem>) {
        Object.assign(this, partial);
        this.location = partial.location ? new StockLocation(partial.location) : new StockLocation({});
    }
}
