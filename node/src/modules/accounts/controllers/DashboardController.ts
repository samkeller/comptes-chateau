import { Router, Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import DashboardMonthlyByPosteQueryParser from "../services/queryMappers/parsers/DashboardMonthlyByPosteQueryParser";
import { badRequest, unauthorized } from "../../../utils/AppError";
import { getAccountIdFromParams } from "../utils/accountParams";

const DashboardRoutes = Router({ mergeParams: true });

DashboardRoutes.get("/overview", async (req: Request, res: Response) => {
    if (typeof req.session.userId !== "number") {
        throw unauthorized("UNAUTHORIZED", "Non authentifié");
    }

    const accountId = getAccountIdFromParams(req.params);
    const dashboardService = new DashboardService();
    const data = await dashboardService.getOverview(req.session.userId, accountId);
    res.json(data);
});

/**
 * GET /api/dashboard/monthly-by-poste?from=2025-01-01&to=2026-02-28
 * Agrège les opérations par mois et par poste
 */
DashboardRoutes.get("/monthly-by-poste", async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);
    const query = DashboardMonthlyByPosteQueryParser.parse(req.query);
    const dashboardService = new DashboardService();
    const data = await dashboardService.getMonthlyByPoste(query.from, query.to, query.posteIds, accountId);
    res.json(data);
});

DashboardRoutes.get("/budget-vs-actual", async (req: Request, res: Response) => {
    const accountId = getAccountIdFromParams(req.params);

    const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1; // Default to current month
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear(); // Default to current year

    const dashboardService = new DashboardService();
    const data = await dashboardService.getBudgetVsActual(accountId, month, year);
    res.json(data);
});

export default DashboardRoutes;
