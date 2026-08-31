import { StockUnitUnits } from "@/interfaces/stocks/StockUnit";

export interface CreateStockUnitDto {
    /**
     * Id tel qu'existant en base (opérations update). Donnée technique.
     */
    id?: number;
    /**
     * Id/clef unique pour l'affichage et les opérations front
     */
    clientId: string;
    locationId: number;
    quantity: number;
    unit: StockUnitUnits;
    expirationDate?: Date;
}