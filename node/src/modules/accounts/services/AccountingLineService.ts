import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { AccountingLine } from "../entities/AccountingLine";
import { normalizeApiDateInput } from "../../../utils/ApiDateUtils";
import { badRequest } from "../../../utils/AppError";

export default class AccountingLineService {

    private accountingLineRepo;

    constructor(manager?: EntityManager) {
        this.accountingLineRepo = manager ?
            manager.getRepository(AccountingLine) :
            AppDataSource.getRepository(AccountingLine);

    }

    private async resolveExistingLinesById(accountingLines: Partial<AccountingLine>[]): Promise<Map<number, AccountingLine>> {
        const ids = accountingLines
            .map((line) => line.id)
            .filter((id): id is number => typeof id === "number" && id > 0);

        if (ids.length === 0) {
            return new Map<number, AccountingLine>();
        }

        const existingLines = await this.accountingLineRepo.findBy({ id: In(ids) });
        return new Map(existingLines.map((line) => [line.id, line]));
    }

    private normalizeAndValidateLine(
        accountingLine: Partial<AccountingLine>,
        existingLine: AccountingLine | undefined,
        context: string
    ): Partial<AccountingLine> {
        const hasIsChecked = "isChecked" in accountingLine;
        const hasDateValeur = "dateValeur" in accountingLine;

        const normalizedDateOperation = normalizeApiDateInput(accountingLine.dateOperation) ?? undefined;
        const normalizedDateValeur = normalizeApiDateInput(accountingLine.dateValeur);

        const effectiveIsChecked = hasIsChecked ? Boolean(accountingLine.isChecked) : (existingLine?.isChecked ?? false);
        const effectiveDateValeur = hasDateValeur ? normalizedDateValeur : (existingLine?.dateValeur ?? null);

        if (effectiveIsChecked && !effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: checked operation must have a dateValeur.`);
        }

        if (!effectiveIsChecked && effectiveDateValeur) {
            throw badRequest("OPERATION_VALIDATION", `${context}: unchecked operation cannot have a dateValeur.`);
        }

        if (!hasIsChecked && !hasDateValeur) {
            return {
                ...accountingLine,
                dateOperation: normalizedDateOperation
            };
        }

        return {
            ...accountingLine,
            dateOperation: normalizedDateOperation,
            ...(hasIsChecked && { isChecked: effectiveIsChecked }),
            ...(hasDateValeur && { dateValeur: effectiveDateValeur })
        };
    }

    async save(accountingLine: Partial<AccountingLine>) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLine = typeof accountingLine.id === "number" && accountingLine.id > 0 ?
            await this.accountingLineRepo.findOneBy({ id: accountingLine.id }) :
            undefined;

        const normalizedLine = this.normalizeAndValidateLine(
            accountingLine,
            existingLine ?? undefined,
            `AccountingLine ${accountingLine.id ?? "new"}`
        );

        return this.accountingLineRepo.save(normalizedLine);
    }

    async saveAll(accountingLines: Partial<AccountingLine>[]) {
        // TODO add validation (https://github.com/typestack/class-validator)
        const existingLinesById = await this.resolveExistingLinesById(accountingLines);

        const normalizedLines = accountingLines.map((line, index) => this.normalizeAndValidateLine(
            line,
            typeof line.id === "number" && line.id > 0 ? existingLinesById.get(line.id) : undefined,
            `AccountingLine batch item ${index}`
        ));

        return this.accountingLineRepo.save(normalizedLines);
    }
}

