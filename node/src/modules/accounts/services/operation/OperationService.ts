import { ParsedQs } from "qs";
import { In } from "typeorm";
import { AppDataSource } from "../../../../db/dataSource";
import { AccountingLine as AccountLine } from "../../entities/AccountingLine";
import AccountingLineService from "../AccountingLineService";
import TableQueryMapper from "../queryMappers/TableQueryMapper";
import operationTableQueryConfig from "../queryMappers/operationTableQueryConfig";
import TableQueryParser from "../queryMappers/parsers/TableQueryParser";
import { normalizeApiDateInput } from "../../../../utils/ApiDateUtils";
import { OperationBatchCheckPayload } from "./OperationDtos";
import { badRequest, notFound } from "../../../../utils/AppError";

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
        return new AccountingLineService().save(line) as Promise<AccountLine>;
    }

    async checkBatch(payload: OperationBatchCheckPayload): Promise<{ updatedCount: number }> {
        const normalizedChecks = payload.checks.map((check) => {
            const normalizedDateValeur = normalizeApiDateInput(check.dateValeur);
            if (!normalizedDateValeur)
                throw badRequest("OPERATION_VALIDATION", `dateValeur invalide : ${check.dateValeur}`);
            return { id: check.id, isChecked: check.isChecked, dateValeur: normalizedDateValeur };
        });

        const updatedLines = await AppDataSource.transaction(async (manager) => {
            const service = new AccountingLineService(manager);
            const repo = manager.getRepository(AccountLine);

            const ids = normalizedChecks.map((check) => check.id);
            const existingLines = await repo.findBy({ id: In(ids) });

            if (existingLines.length !== ids.length)
                throw notFound("OPERATION_NOT_FOUND", "One or more operations were not found.");

            return service.saveAll(normalizedChecks);
        });

        return { updatedCount: updatedLines.length };
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

    async getAllForExport(): Promise<AccountLine[]> {
        return this.accountLineRepo
            .createQueryBuilder("al")
            .leftJoinAndSelect("al.nature", "nature")
            .leftJoinAndSelect("al.poste", "poste")
            .orderBy("al.dateOperation", "DESC")
            .addOrderBy("al.id", "DESC")
            .getMany();
    }
}