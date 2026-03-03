import { EntityManager } from "typeorm";
import { AppDataSource } from "../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";

export default class AccountingLineService {

    private accountingLineRepo;

    constructor(manager?: EntityManager) {
        this.accountingLineRepo = manager ?
            manager.getRepository(AccountingLine) :
            AppDataSource.getRepository(AccountingLine);

    }

    async save(accounttingLine: Partial<AccountingLine>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.accountingLineRepo.save(accounttingLine);
    }

    async saveAll(accountingLines: Partial<AccountingLine>[]) {
        // TODO add validation (https://github.com/typestack/class-validator)
        return this.accountingLineRepo.save(accountingLines);
    }
}

