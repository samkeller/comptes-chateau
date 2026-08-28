export interface StockIntakeLineDto {
    label: string;
    barcode?: string | null;
    unit: string;
    quantity: number;
    expirationDate?: string | null;
    imageUrl?: string | null;
    unitLabel?: string | null;
}

export interface StockIntakeDto {
    locationId: number;
    occurredAt?: Date;
    source?: string | null;
    lines: StockIntakeLineDto[];
}
