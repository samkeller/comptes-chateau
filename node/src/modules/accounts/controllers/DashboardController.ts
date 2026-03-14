import { Router, Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import DashboardMonthlyByPosteQueryParser from "../services/queryMappers/parsers/DashboardMonthlyByPosteQueryParser";
import { QueryParamsValidationError } from "../services/queryMappers/parsers/QueryParamsParser";

const DashboardRoutes = Router();

DashboardRoutes.get("/overview", async (req: Request, res: Response) => {
    try {
        if (typeof req.session.userId !== "number") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const dashboardService = new DashboardService();
        const data = await dashboardService.getOverview(req.session.userId);

        return res.json(data);
    } catch (error) {
        console.error("Error in dashboard overview endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/dashboard/monthly-by-poste?from=2025-01-01&to=2026-02-28
 * Agrège les opérations par mois et par poste
 */
DashboardRoutes.get("/monthly-by-poste", async (req: Request, res: Response) => {
    try {
        const query = DashboardMonthlyByPosteQueryParser.parse(req.query);

        const dashboardService = new DashboardService();
        const data = await dashboardService.getMonthlyByPoste(query.from, query.to, query.posteIds);

        return res.json(data);
    } catch (error) {
        if (error instanceof QueryParamsValidationError) {
            return res.status(400).json({ error: error.message });
        }

        console.error("Error in monthly-by-poste endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default DashboardRoutes;
