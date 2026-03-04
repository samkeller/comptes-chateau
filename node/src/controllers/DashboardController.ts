import { Router, Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import { parseApiDateString } from "../utils/ApiDateUtils";

const DashboardRoutes = Router();

DashboardRoutes.get("/overview", async (_req: Request, res: Response) => {
    try {
        const dashboardService = new DashboardService();
        const data = await dashboardService.getOverview();

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
        const fromMonth = req.query.from as string | undefined;
        const toMonth = req.query.to as string | undefined;
        const posteIdsParam = req.query.posteIds as string | undefined;

        if (!fromMonth || !toMonth) throw new Error("Les paramètres 'from' et 'to' sont requis au format YYYY-MM-DD");
        if (!posteIdsParam || posteIdsParam.trim() === "") throw new Error("Le paramètre 'posteIds' est requis et doit contenir au moins un ID de poste");

        const dashboardService = new DashboardService();
        const fromDate = parseApiDateString(fromMonth);
        const toDate = parseApiDateString(toMonth);
        const posteIds = posteIdsParam.split(",")
            .map((value) => parseInt(value.trim(), 10))
            .filter((value) => !Number.isNaN(value));

        const data = await dashboardService.getMonthlyByPoste(fromDate, toDate, posteIds);

        return res.json(data);
    } catch (error) {
        console.error("Error in monthly-by-poste endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default DashboardRoutes;
