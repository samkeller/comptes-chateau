import { EntityManager } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";
import { normalizeApiDateInput } from "../utils/ApiDateUtils";

export default class AccountingLineService {

    private accountingLineRepo;

    constructor(manager?: EntityManager) {
        this.accountingLineRepo = manager ?
            manager.getRepository(AccountingLine) :
            AppDataSource.getRepository(AccountingLine);

    }

    async save(accountingLine: Partial<AccountingLine>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.accountingLineRepo.save({
            ...accountingLine,
            dateOperation: normalizeApiDateInput(accountingLine.dateOperation) ?? undefined,
            dateValeur: normalizeApiDateInput(accountingLine.dateValeur)
        });
    }

    async saveAll(accountingLines: Partial<AccountingLine>[]) {
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.accountingLineRepo.save(accountingLines.map((line) => ({
            ...line,
            dateOperation: normalizeApiDateInput(line.dateOperation) ?? undefined,
            dateValeur: normalizeApiDateInput(line.dateValeur)
        })));
}
}

