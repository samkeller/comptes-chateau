import { Router, Request, Response } from "express";
import { AccountingLine } from "../entities/AccountingLine";
import { AppDataSource } from "../db/dataSource";

const OperationRoutes = Router();

OperationRoutes.get('/', (req: Request, res: Response) => {
    const accountingLineRepo = AppDataSource.getRepository(AccountingLine)
    accountingLineRepo.find().then(accountingLines => {
        return res.json(accountingLines);
    })
})

OperationRoutes.post('/', (req: Request, res: Response) => {
    const accountingLineRepo = AppDataSource.getRepository(AccountingLine)

    // TODO add validation (https://github.com/typestack/class-validator)

    accountingLineRepo.save(req.body).then(accountingLines => {
        return res.json(accountingLines);
    })
})

export default OperationRoutes