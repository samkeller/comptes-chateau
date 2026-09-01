import express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { errorMiddleware } from "../../core/middlewares/errorMiddleware";

describe("StockItemRoutes integration", () => {
    let app: express.Express;

    beforeAll(async () => {
        const { default: stockRoutes } =
            await import("../routes/StockRoutes");

        app = express();

        app.use(express.json());
        app.use("/stocks", stockRoutes);
        app.use(errorMiddleware);
    });

    it("GET /stocks/items retourne les stock items", async () => {
        const response = await request(app)
            .get("/stocks/items");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });
});
