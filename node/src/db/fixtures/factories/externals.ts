import type { DeepPartial, EntityManager } from "typeorm";
import { BanquePostaleOperationImport } from "../../../modules/externals/entities/BanquePostaleImport";
import { formatApiDate } from "../../../utils/DateUtils";
import { EntityFactory } from "../EntityFactory";

export class BanquePostaleImportFactory extends EntityFactory<BanquePostaleOperationImport, "accountId"> {
    constructor(manager: EntityManager) {
        super(manager, BanquePostaleOperationImport);
    }

    protected defaults(sequence: number): DeepPartial<BanquePostaleOperationImport> {
        const today = formatApiDate(new Date());
        return {
            compositeExternalId: `fixture-import-${sequence}`,
            dateOperation: today,
            label: `Opération importée ${sequence}`,
            amount: 0,
            rowNumber: sequence,
            metadata: { accountNumber: "0000000A000", type: "CCP", exportDate: today, balance: 0 },
            accountLineId: null,
        };
    }
}
