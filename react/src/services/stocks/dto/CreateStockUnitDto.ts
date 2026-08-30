export interface CreateStockUnitDto {
    locationId: number;
    quantity: number;
    unit: string;
    expirationDate?: Date;
}