import { parseApiDate } from "@/utils/DatesUtils";
import { StockMovementType } from "../../../../shared/dist/contracts";

export default class StockMovement {

    id: number = 0;
    itemId: number = 0;
    itemLabel: string = "";
    unitId: number = 0;
    quantity: number = 0;
    unit: string = "";
    locationId: number = 0;
    locationLabel: string = "";
    type: StockMovementType = "IN"; // Assuming a default value
    createdAt: Date = new Date();

    constructor(partial: Partial<StockMovement>) {
        Object.assign(this, partial);

        if (partial.createdAt) {
            const parsedDateOperation = parseApiDate(partial.createdAt)
            if (parsedDateOperation) {
                this.createdAt = parsedDateOperation
            }
        }
    }
}
