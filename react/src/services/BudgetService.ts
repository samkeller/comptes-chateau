import axios from "axios";
import BaseService from "./BaseService";
import { BudgetItem } from "../interfaces/BudgetItem";

class BudgetService extends BaseService {
    getBudgetItems(): Promise<BudgetItem[]> {
        return axios.get(`${this.apiUrl}/budget`).then((response) => response.data);
    }
}

export default BudgetService;
