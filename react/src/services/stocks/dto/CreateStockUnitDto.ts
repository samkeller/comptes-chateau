export interface CreateStockUnitDto {
    locationId: number;
    quantity: number;
    unit: string;
    label?: string;
    expirationDate?: Date;
}