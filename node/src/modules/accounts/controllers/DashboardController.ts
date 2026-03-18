import { Router, Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import DashboardMonthlyByPosteQueryParser from "../services/queryMappers/parsers/DashboardMonthlyByPosteQueryParser";
import { unauthorized } from "../../../utils/AppError";

const DashboardRoutes = Router();

DashboardRoutes.get("/overview", async (req: Request, res: Response) => {
    if (typeof req.session.userId !== "number") {
        throw unauthorized("UNAUTHORIZED", "Non authentifié");
    }

    const dashboardService = new DashboardService();
    const data = await dashboardService.getOverview(req.session.userId);
    res.json(data);
});

/**
 * GET /api/dashboard/monthly-by-poste?from=2025-01-01&to=2026-02-28
 * Agrège les opérations par mois et par poste
 */
DashboardRoutes.get("/monthly-by-poste", async (req: Request, res: Response) => {
    const query = DashboardMonthlyByPosteQueryParser.parse(req.query);
    const dashboardService = new DashboardService();
    const data = await dashboardService.getMonthlyByPoste(query.from, query.to, query.posteIds);
    res.json(data);
});

export default DashboardRoutes;
