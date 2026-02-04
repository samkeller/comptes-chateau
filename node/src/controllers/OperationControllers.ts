import { Router, Request, Response } from "express";
import { AccountingLine } from "../entities/AccountingLine";
import { AppDataSource } from "../db/dataSource";
import { QueryBuilderService, FilterCondition, SortCondition, PaginationOptions } from "../services/QueryBuilderService";

const OperationRoutes = Router();

OperationRoutes.get('/lazy', (req: Request, res: Response) => {
    try {
        const accountingLineRepo = AppDataSource.getRepository(AccountingLine);

        // Pagination parameters
        const skip = parseInt(req.query.skip as string) || 0;
        const take = parseInt(req.query.take as string) || 100;

        // Sorting parameters
        const sortField = req.query.sortField as string;
        const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Filter parameters
        const filters: FilterCondition[] = [];

        // dateOperation filter (complex: between two dates OR empty)
        if (req.query.dateOperationFrom) {
            filters.push({
                field: 'dateOperation',
                operator: 'gte',
                value: new Date(req.query.dateOperationFrom as string)
            });
        }
        if (req.query.dateOperationTo) {
            filters.push({
                field: 'dateOperation',
                operator: 'lte',
                value: new Date(req.query.dateOperationTo as string)
            });
        }

        // dateValeur filter (complex: between two dates OR null)
        if (req.query.dateValeurFrom) {
            filters.push({
                field: 'dateValeur',
                operator: 'gte',
                value: new Date(req.query.dateValeurFrom as string)
            });
        }
        if (req.query.dateValeurTo) {
            filters.push({
                field: 'dateValeur',
                operator: 'eq',
                value: new Date(req.query.dateValeurTo as string)
            });
        }

        // operation filter (text search)
        if (req.query.operation) {
            filters.push({
                field: 'operation',
                operator: 'like',
                value: req.query.operation as string
            });
        }

        // nature filter (dropdown - multiple IDs possible)
        if (req.query.nature) {
            const natureIds = Array.isArray(req.query.nature)
                ? (req.query.nature as string[]).map(Number)
                : [Number(req.query.nature)];
            filters.push({
                field: 'nature.id',
                operator: 'in',
                value: natureIds
            });
        }

        // poste filter (dropdown - multiple IDs possible)
        if (req.query.poste) {
            const posteIds = Array.isArray(req.query.poste)
                ? (req.query.poste as string[]).map(Number)
                : [Number(req.query.poste)];
            filters.push({
                field: 'poste.id',
                operator: 'in',
                value: posteIds
            });
        }

        // solde filter (number - range)
        if (req.query.soldeMin) {
            filters.push({
                field: 'solde',
                operator: 'gte',
                value: parseFloat(req.query.soldeMin as string)
            });
        }
        if (req.query.soldeMax) {
            filters.push({
                field: 'solde',
                operator: 'lte',
                value: parseFloat(req.query.soldeMax as string)
            });
        }

        // isHorsCB filter (boolean)
        if (req.query.isHorsCB !== undefined) {
            filters.push({
                field: 'isHorsCB',
                operator: 'eq',
                value: req.query.isHorsCB === 'true'
            });
        }

        // Build query
        let qb = accountingLineRepo.createQueryBuilder('al')
            .leftJoinAndSelect('al.nature', 'nature')
            .leftJoinAndSelect('al.poste', 'poste');

        // Apply filters
        qb = QueryBuilderService.applyFilters(qb, filters);

        // Apply sorting
        const sortCondition: SortCondition | null = sortField
            ? { field: sortField, direction: sortOrder }
            : null;
        qb = QueryBuilderService.applySort(qb, sortCondition);

        // Get total count before pagination
        qb.clone().getCount().then(totalRecords => {
            // Apply pagination
            const paginationOptions: PaginationOptions = { skip, take };
            QueryBuilderService.applyPagination(qb, paginationOptions);

            qb.getMany().then(accountingLines => {
                return res.json({
                    data: accountingLines,
                    totalRecords: totalRecords
                });
            });
        });
    } catch (error) {
        console.error('Error in lazy load endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

OperationRoutes.post('/', (req: Request, res: Response) => {
    const accountingLineRepo = AppDataSource.getRepository(AccountingLine)

    // TODO add validation (https://github.com/typestack/class-validator)

    accountingLineRepo.save(req.body).then(accountingLine => {
        return res.json(accountingLine);
    })
})

export default OperationRoutes