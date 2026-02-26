import { Router, Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import { parseLocaleIsoDate } from "../utils/DateUtils";

const DashboardRoutes = Router();

/**
 * GET /api/dashboard/monthly-by-poste?from=2025-01&to=2026-02
 * Agrège les opérations par mois et par poste
 */
DashboardRoutes.get("/monthly-by-poste", async (req: Request, res: Response) => {
    try {
        const fromMonth = req.query.from as string | undefined;
        const toMonth = req.query.to as string | undefined;
        const posteIdsParam = req.query.posteIds as string | undefined;

        // Format expected: DD/MMM/YYYY
        if (!fromMonth || !toMonth) throw new Error("Les paramètres 'from' et 'to' sont requis au format DD/MM/YYYY");
        if (!posteIdsParam || posteIdsParam.trim() === "") throw new Error("Le paramètre 'posteIds' est requis et doit contenir au moins un ID de poste");

        const dashboardService = new DashboardService();
        const fromDate = parseLocaleIsoDate(fromMonth);
        const toDate = parseLocaleIsoDate(toMonth);
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
