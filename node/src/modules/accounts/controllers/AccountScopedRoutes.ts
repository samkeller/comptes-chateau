import { Router } from "express";
import OperationRoutes from "./OperationController";
import PosteRoutes from "./PosteController";
import RecurringExpenseRoutes from "./RecurringExpenseController";
import DashboardRoutes from "./DashboardController";
import BudgetRoutes from "./BudgetController";
import { AccountIdParamSchema, validateParams } from "../../core/middlewares/validate";
import { requireExistingAccount } from "../middlewares/requireExistingAccount";

const AccountScopedRoutes = Router({ mergeParams: true });

AccountScopedRoutes.use(validateParams(AccountIdParamSchema));
AccountScopedRoutes.use(requireExistingAccount);

AccountScopedRoutes.use("/operations", OperationRoutes);
AccountScopedRoutes.use("/postes", PosteRoutes);
AccountScopedRoutes.use("/recurring-expenses", RecurringExpenseRoutes);
AccountScopedRoutes.use("/dashboard", DashboardRoutes);
AccountScopedRoutes.use("/budget", BudgetRoutes);

export default AccountScopedRoutes;