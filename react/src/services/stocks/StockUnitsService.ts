import axios from "axios";
import BaseService from "../BaseService";

export default class StockUnitsService extends BaseService {
    private readonly stocksApiUrl = `${this.apiUrl}/stocks/units`;

    /** Coche un exemplaire : il sort du stock (mouvement OUT). */
    async take(unitId: number): Promise<void> {
        await axios.post(`${this.stocksApiUrl}/${unitId}/take`);
    }

    /** Supprime un exemplaire saisi par erreur (mouvement DELETE). */
    async delete(unitId: number): Promise<void> {
        await axios.delete(`${this.stocksApiUrl}/${unitId}`);
    }
}
