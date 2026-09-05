import axios from "axios";
import BaseService from "../BaseService";
import StockUnit from "@/interfaces/stocks/StockUnit";
import { CreateStockUnitDto } from "./dto/CreateStockUnitDto";
import { formatApiDate } from "@/utils/DatesUtils";

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

        const formattedPayload = {
            ...payloadWithoutIdAndClientId,
            ...(payloadWithoutIdAndClientId.expirationDate && { expirationDate: formatApiDate(payloadWithoutIdAndClientId.expirationDate) }),
        };
        
        return axios.post(`${this.stocksApiUrl}/`, { itemId, ...formattedPayload })
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
        /**
         * Supprime les champs `id` et `clientId` du payload avant de l'envoyer à l'API.
         */
        const {
            id: _,
            clientId,
            ...minimalPayload
        } = payload;

        const formattedPayload = {
            ...minimalPayload,
            ...(minimalPayload.expirationDate && { expirationDate: formatApiDate(minimalPayload.expirationDate) }),
        };

        return axios.patch(`${this.stocksApiUrl}/${id}`, { itemId, ...formattedPayload })
            .then((res) => new StockUnit(res.data));
    }

    delete(id: number): Promise<void> {
        return axios.delete(`${this.stocksApiUrl}/${id}`)
            .then(() => undefined);
    }

    takeUnit(unitId: number): Promise<StockUnit> {
        return axios.post(`${this.stocksApiUrl}/${unitId}/take`)
            .then((res) => new StockUnit(res.data));
    }
}