
import type { BanquePostaleOperationImport } from "../entities/BanquePostaleImport";
import type { BanquePostaleOperationImportDto } from "@chocosous/shared";

export function toBanquePostaleOperationDto(op: BanquePostaleOperationImport): BanquePostaleOperationImportDto {
    return {
        id: op.id,
        accountId: op.accountId,
        compositeExternalId: op.compositeExternalId,
        dateOperation: op.dateOperation,
        label: op.label,
        amount: op.amount,
        rowNumber: op.rowNumber,
        metadata: op.metadata,
    };
}