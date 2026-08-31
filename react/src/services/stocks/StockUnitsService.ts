import axios from "axios";
import BaseService from "../BaseService";
import StockUnit from "@/interfaces/stocks/StockUnit";
import { TakeStockUnitDto } from "./dto/TakeStockUnitDto";
import { CreateStockUnitDto } from "./dto/CreateStockUnitDto";

export default class StockUnitsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/units`;

    /**
     * Récupère toutes les stockUnits d'un stockItem.
     * @param itemId 
     * @returns
     */
    getStockUnitsByItemId(itemId: number): Promise<StockUnit[]> {
        return axios.get(`${this.stocksApiUrl}/`, {
            params: { itemId },
        }).then((res) =>
            res.data.map((unit: Partial<StockUnit>) => new StockUnit(unit))
        );
    }

    /**
     * Crée une nouvelle stockUnit.
     * @param itemId Id du stockItem
     * @param payload 
     * @returns 
     */
    create(itemId: number, payload: CreateStockUnitDto): Promise<StockUnit> {
        const { id, clientId, ...payloadWithoutIdAndClientId } = payload;
        return axios.post(`${this.stocksApiUrl}/`, { itemId, ...payloadWithoutIdAndClientId })
            .then((res) => new StockUnit(res.data));
    }

    /**
     * Met à jour une stockUnit existante.
     * @param id Id de la stockUnit à mettre à jour
     * @param itemId Id du stockItem auquel appartient la stockUnit
     * @param payload 
     * @returns 
     */
    update(id: number, itemId: number, payload: CreateStockUnitDto): Promise<StockUnit> {
        const { id: _, clientId, ...payloadWithoutIdAndClientId } = payload;
        return axios.patch(`${this.stocksApiUrl}/${id}`, { itemId, ...payloadWithoutIdAndClientId })
            .then((res) => new StockUnit(res.data));
    }

    delete(id: number): Promise<void> {
        return axios.delete(`${this.stocksApiUrl}/${id}`)
            .then(() => undefined);
    }

    takeUnit(unitId: number, payload: TakeStockUnitDto): Promise<StockUnit> {
        return axios.post(`${this.stocksApiUrl}/${unitId}/take`, payload)
            .then((res) => new StockUnit(res.data));
    }
}