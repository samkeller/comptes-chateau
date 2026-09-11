import { AppDataSource } from "../../../db/dataSource";
import { Account } from "../entities/Account";
import type { AccountDto } from "@chocosous/shared";
import type { EntityManager, Repository } from "typeorm";

export default class AccountService {
    private readonly accountRepo: Repository<Account>;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.accountRepo = manager.getRepository(Account);
    }

    async getById(accountId: number): Promise<Account | null> {
        return this.accountRepo.findOne({ where: { id: accountId } });
    }

    async getAll(): Promise<AccountDto[]> {
        const accounts = await this.accountRepo.find({
            select: { id: true, label: true },
            order: { id: "ASC" }
        });

        return accounts.map((account) => ({
            id: account.id,
            label: account.label
        }));
    }

    async exists(accountId: number): Promise<boolean> {
        return this.accountRepo.exists({ where: { id: accountId } });
    }

}
