export default class StockLocation {
    id: number = 0;
    label: string = "";

    constructor(partial: Partial<StockLocation>) {
        Object.assign(this, partial);
    }
}
