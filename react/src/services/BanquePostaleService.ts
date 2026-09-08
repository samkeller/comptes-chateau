import { BanquePostaleCsvData, BanquePostaleImportPayload, BanquePostaleImportResultPayload } from "@chocosous/shared";
import BaseService from "./BaseService";
import axios from "axios";
import { formatApiDate } from "@/utils/DatesUtils";


export default class BanquePostaleService extends BaseService {

    import(accountId: number, data: BanquePostaleCsvData): Promise<BanquePostaleImportResultPayload> {
        
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

        return axios.post(this.apiUrl + "/externals/banque-postale/import", body).then(response => response.data);
    }
}
