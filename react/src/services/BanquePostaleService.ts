import { BanquePostaleCsvData, BanquePostaleImportPayload } from "@chocosous/shared";
import BaseService from "./BaseService";
import axios from "axios";
import { formatApiDate } from "@/utils/DatesUtils";
import BanquePostaleImportResult from "@/interfaces/Externals/BanquePostaleImportResult";


export default class BanquePostaleService extends BaseService {

    import(accountId: number, data: BanquePostaleCsvData): Promise<BanquePostaleImportResult> {
        
        const body: BanquePostaleImportPayload = {
            accountId,
            ...data,
            exportDate: formatApiDate(data.exportDate),
            operations: data.operations.map(o => {
                return {
                    ...o,
                    dateOperation: formatApiDate(o.dateOperation), // API expects date as string
                }
            })
        };

        return axios.post(this.apiUrl + "/externals/banque-postale/import", body).then(response => new BanquePostaleImportResult(response.data));
    }
}
