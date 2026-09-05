export default class StockLocation {
    id: number = 0;
    label: string = "";
    stockUnitCount: number = 0;

    constructor(partial: Partial<StockLocation>) {
        Object.assign(this, partial);
    }
}
