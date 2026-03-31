import { AppDataSource } from "../../../db/dataSource";
import { Account } from "../entities/Account";

export interface AccountDto {
    id: number;
    label: string;
}

export default class AccountService {
    private accountRepo = AppDataSource.getRepository(Account);

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
