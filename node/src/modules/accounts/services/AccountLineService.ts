import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountLine } from "../entities/AccountLine";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { badRequest } from "../../../utils/AppError";

export default class AccountLineService {

    private accountLineRepo;

    constructor(manager?: EntityManager) {
        this.accountLineRepo = manager ?
            manager.getRepository(AccountLine) :
            AppDataSource.getRepository(AccountLine);

    }

    private async resolveExistingLinesById(accountLines: Partial<AccountLine>[]): Promise<Map<number, AccountLine>> {
        const ids = accountLines
            .map((line) => line.id)
            .filter((id): id is number => typeof id === "number" && id > 0);

        if (ids.length === 0) {
            return new Map<number, AccountLine>();
        }

        const existingLines = await this.accountLineRepo.findBy({ id: In(ids) });
        return new Map(existingLines.map((line) => [line.id, line]));
    }

    private normalizeAndValidateLine(
        accountLine: Partial<AccountLine>,
        existingLine: AccountLine | undefined,
        context: string
    ): Partial<AccountLine> {
        const hasIsChecked = "isChecked" in accountLine;
        const hasDateValeur = "dateValeur" in accountLine;

        const normalizedDateOperation = normalizeApiDateInput(accountLine.dateOperation) ?? undefined;
        const normalizedDateValeur = normalizeApiDateInput(accountLine.dateValeur);

        const effectiveIsChecked = hasIsChecked ? Boolean(accountLine.isChecked) : (existingLine?.isChecked ?? false);
        const effectiveDateValeur = hasDateValeur ? normalizedDateValeur : (existingLine?.dateValeur ?? null);

        if (effectiveIsChecked && !effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: checked operation must have a dateValeur.`);
        }

        if (!effectiveIsChecked && effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: unchecked operation cannot have a dateValeur.`);
        }

        if (!hasIsChecked && !hasDateValeur) {
            return {
                ...accountLine,
                dateOperation: normalizedDateOperation
            };
        }

        return {
            ...accountLine,
            dateOperation: normalizedDateOperation,
            ...(hasIsChecked && { isChecked: effectiveIsChecked }),
            ...(hasDateValeur && { dateValeur: effectiveDateValeur })
        };
    }

    async save(accountLine: Partial<AccountLine>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLine = typeof accountLine.id === "number" && accountLine.id > 0 ?
            await this.accountLineRepo.findOneBy({ id: accountLine.id }) :
            undefined;

        const normalizedLine = this.normalizeAndValidateLine(
            accountLine,
            existingLine ?? undefined,
            `AccountLine ${accountLine.id ?? "new"}`
        );

        return this.accountLineRepo.save(normalizedLine);
    }

    async saveAll(accountLines: Partial<AccountLine>[]) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLinesById = await this.resolveExistingLinesById(accountLines);

        const normalizedLines = accountLines.map((line, index) => this.normalizeAndValidateLine(
            line,
            typeof line.id === "number" && line.id > 0 ? existingLinesById.get(line.id) : undefined,
            `AccountLine batch item ${index}`
        ));

        return this.accountLineRepo.save(normalizedLines);
    }
}

