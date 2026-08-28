import { parseApiDateTime } from "@/utils/DatesUtils";

export default class StockItem {
    id: number = 0;
    label: string = "";
    barcode: string | null = null;

    defaultUnit: string = "";

    imageUrl: string | null = null;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;

    constructor(partial: Partial<StockItem>) {
        Object.assign(this, partial);

        if (partial.createdAt) this.createdAt = parseApiDateTime(partial.createdAt) ?? undefined;
        if (partial.updatedAt) this.updatedAt = parseApiDateTime(partial.updatedAt) ?? undefined;
        if (partial.deletedAt) this.deletedAt = parseApiDateTime(partial.deletedAt) ?? null;
    }
}
