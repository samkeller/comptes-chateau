export default class StockLocation {
    id: number = 0;
    label: string = "";
    createdAt: string = "";
    updatedAt: string = "";

    constructor(partial: Partial<StockLocation>) {
        Object.assign(this, partial);
    }
}
