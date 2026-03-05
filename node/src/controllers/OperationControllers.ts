import { Router, Request, Response } from "express";
import { AccountingLine } from "../entities/AccountingLine";
import { AppDataSource } from "../db/dataSource";
import AccountingLineService from "../services/AccountingLineService";
import TableQueryParser, { TableQueryValidationError } from "../services/queryMappers/parsers/TableQueryParser";
import TableQueryMapper from "../services/queryMappers/TableQueryMapper";
import operationTableQueryConfig from "../services/queryMappers/operationTableQueryConfig";

const OperationRoutes = Router();
const accountingLineService = new AccountingLineService();
const lazyTableQueryParserOptions = {
    allowedSortFields: new Set(Object.keys(operationTableQueryConfig.sortHandlers)),
    allowedFilterFields: new Set(Object.keys(operationTableQueryConfig.filterHandlers)),
    defaultTake: 100,
    maxTake: 200
};

OperationRoutes.get('/lazy', async (req: Request, res: Response) => {
    try {
        const accountingLineRepo = AppDataSource.getRepository(AccountingLine);
        const parsedQuery = TableQueryParser.parse(req.query, lazyTableQueryParserOptions);

        // Build query
        const qb = accountingLineRepo.createQueryBuilder('al')
            .leftJoinAndSelect('al.nature', 'nature')
            .leftJoinAndSelect('al.poste', 'poste');

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

        // Get total count before pagination
        const totalRecords = await qb.clone().getCount();

        // Apply pagination
        qb.skip(parsedQuery.pagination.skip).take(parsedQuery.pagination.take);

        const accountingLines = await qb.getMany();
        return res.json({
            data: accountingLines,
            totalRecords
        });
    } catch (error) {
        if (error instanceof TableQueryValidationError) {
            return res.status(400).json({ error: error.message });
        }

        console.error('Error in lazy load endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

OperationRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const accountingLine = await accountingLineService.save(req.body);
        return res.json(accountingLine);
    } catch (error) {
        console.error('Error creating operation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

export default OperationRoutes