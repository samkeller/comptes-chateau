import { ParamsDictionary } from "express-serve-static-core";
import { badRequest } from "../../../utils/AppError";

export function getAccountIdFromParams(params: ParamsDictionary): number {
    const rawAccountId = params.accountId;
    const accountId = Number(rawAccountId);

    if (!Number.isInteger(accountId) || accountId <= 0) {
        throw badRequest("ACCOUNT_ID_INVALID", `accountId invalide: ${rawAccountId}`);
    }

    return accountId;
}
