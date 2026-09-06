import { AppError } from "../../../../utils/AppError";

export class StockLocationNotEmptyError extends AppError {
    constructor(message: string) { 
        super(409, "LOCATION_NOT_EMPTY", message);
    }
}
