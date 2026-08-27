export interface SaveStockItemDto {
    label: string;
    barcode?: string | null;
    unit: string;
    locationId: number;
    expirationDate?: string | null;
    imageUrl?: string | null;
    initialQuantity?: number;
    occurredAt?: Date;
    source?: string | null;
}
