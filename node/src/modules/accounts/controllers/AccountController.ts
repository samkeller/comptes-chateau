import { Request, Response, Router } from "express";
import AccountService from "../services/AccountService";

const AccountRoutes = Router();
const accountService = new AccountService();

AccountRoutes.get("/", async (_req: Request, res: Response) => {
    const accounts = await accountService.getAll();
    res.json(accounts);
});

export default AccountRoutes;
