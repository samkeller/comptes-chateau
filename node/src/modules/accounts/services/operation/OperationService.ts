import { ParsedQs } from "qs";
import { In } from "typeorm";
import { AppDataSource } from "../../../../db/dataSource";
import { AccountingLine as AccountLine } from "../../entities/AccountingLine";
import AccountingLineService, { AccountingLineValidationError } from "../AccountingLineService";
import TableQueryMapper from "../queryMappers/TableQueryMapper";
import operationTableQueryConfig from "../queryMappers/operationTableQueryConfig";
import TableQueryParser, { TableQueryValidationError } from "../queryMappers/parsers/TableQueryParser";
import { normalizeApiDateInput } from "../../../../utils/ApiDateUtils";
import { OperationBatchCheckInput, OperationBatchCheckPayload } from "./OperationDtos";
import { OperationNotFoundError, OperationValidationError } from "./OperationErrors";

const lazyTableQueryParserOptions = {
    allowedSortFields: new Set(Object.keys(operationTableQueryConfig.sortHandlers)),
    allowedFilterFields: new Set(Object.keys(operationTableQueryConfig.filterHandlers)),
    defaultTake: 100,
    maxTake: 200
};

export default class OperationService {
    private accountLineRepo = AppDataSource.getRepository(AccountLine);

    async getLazy(query: ParsedQs): Promise<{ data: AccountLine[]; totalRecords: number }> {
        const parsedQuery = TableQueryParser.parse(query, lazyTableQueryParserOptions);

        const qb = this.accountLineRepo.createQueryBuilder("al")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste");

        TableQueryMapper.applyFilters(
            qb,
            parsedQuery.filters,
            operationTableQueryConfig.filterHandlers
        );
        TableQueryMapper.applySort(
            qb,
            parsedQuery.sort,
            operationTableQueryConfig.sortHandlers,
            operationTableQueryConfig.defaultSort
        );

        const totalRecords = await qb.clone().getCount();
        qb.skip(parsedQuery.pagination.skip).take(parsedQuery.pagination.take);

        const lines = await qb.getMany();
        return {
            data: lines,
            totalRecords
        };
    }

    async save(line: Partial<AccountLine>): Promise<AccountLine> {
        try {
            const savedLine = await new AccountingLineService().save(line);
            return savedLine as AccountLine;
        } catch (error) {
            if (error instanceof AccountingLineValidationError)
                throw new OperationValidationError(error.message);
            throw error;
        }
    }

    async checkBatch(payload: OperationBatchCheckPayload): Promise<{ updatedCount: number }> {
        if (!Array.isArray(payload.checks) || payload.checks.length === 0) {
            throw new OperationValidationError("Field 'checks' must be a non-empty array.");
        }

        const normalizedChecks = payload.checks.map((check, index) => this.validateAndNormalizeCheckItem(check, index));

        try {
            const updatedLines = await AppDataSource.transaction(async (manager) => {
                const service = new AccountingLineService(manager);
                const repo = manager.getRepository(AccountLine);

                const ids = normalizedChecks.map((check) => check.id);
                const existingLines = await repo.findBy({ id: In(ids) });

                if (existingLines.length !== ids.length)
                    throw new OperationNotFoundError("One or more operations were not found.");

                return service.saveAll(normalizedChecks);
            });

            return { updatedCount: updatedLines.length };
        } catch (error) {
            if (error instanceof AccountingLineValidationError) {
                throw new OperationValidationError(error.message);
            }
            throw error;
        }
    }

    async getAllUncheckedLines(): Promise<AccountLine[]> {
        return this.accountLineRepo
            .createQueryBuilder("al")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste")
            .where("al.isChecked = :isChecked", { isChecked: false })
            .orderBy("al.dateOperation", "DESC")
            .addOrderBy("al.id", "DESC")
            .getMany();
    }

    private validateAndNormalizeCheckItem(check: OperationBatchCheckInput, index: number): {
        id: number;
        isChecked: boolean;
        dateValeur: Date;
    } {
        if (!check || typeof check !== "object")
            throw new OperationValidationError(`Check item ${index} is invalid.`);

        if (typeof check.id !== "number" || check.id <= 0)
            throw new OperationValidationError(`Check item ${index} has invalid id.`);

        if (typeof check.isChecked !== "boolean")
            throw new OperationValidationError(`Check item ${index} must provide isChecked as boolean.`);

        if (typeof check.dateValeur !== "string")
            throw new OperationValidationError(`Check item ${index} must provide dateValeur.`);

        const normalizedDateValeur = normalizeApiDateInput(check.dateValeur);
        if (!normalizedDateValeur)
            throw new OperationValidationError(`Check item ${index} has invalid dateValeur.`);

        return {
            id: check.id,
            isChecked: check.isChecked,
            dateValeur: normalizedDateValeur
        };
    }
}

export { TableQueryValidationError };
