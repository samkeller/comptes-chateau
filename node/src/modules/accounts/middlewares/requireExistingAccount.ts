import { NextFunction, Request, Response } from "express";
import { getAccountIdFromParams } from "../utils/accountParams";
import AccountService from "../services/AccountService";
import { notFound } from "../../../utils/AppError";

const accountService = new AccountService();

export async function requireExistingAccount(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const accountId = getAccountIdFromParams(req.params);
    const exists = await accountService.exists(accountId);

    if (!exists) {
        throw notFound("ACCOUNT_NOT_FOUND", `Compte introuvable (${accountId}).`);
    }

    next();
}
