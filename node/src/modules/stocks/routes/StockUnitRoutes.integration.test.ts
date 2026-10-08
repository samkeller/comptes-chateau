import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";
import { User } from "../../core/entities/User";
import { UserXpActionsPoints } from "../../core/utils/UserXPUtils";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

describe("StockUnitRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;

    beforeAll(async () => {
        const { default: stockUnitRoutes } = await import("./StockUnitRoutes");
        app = createTestApp("/stocks/units", stockUnitRoutes);
    });

    async function seedUnit() {
        const location = await testDataSource.getRepository(StockLocation).save({ label: "Cuisine" });
        const item = await testDataSource.getRepository(StockItem).save({ label: "Pâtes", defaultUnit: "g" });
        const unit = await testDataSource.getRepository(StockUnit).save({
            itemId: item.id, locationId: location.id, quantity: 500, unit: "g", expirationDate: "2027-01-01",
        });
        return { item, unit };
    }

    it("POST /:id/take consumes the unit: 204, OUT movement, XP, product kept", async () => {
        const { item, unit } = await seedUnit();
        const xpBefore = (await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID })).totalXp;

        const response = await request(app).post(`/stocks/units/${unit.id}/take`);

        expect(response.status).toBe(204);
        expect(response.body).toEqual({});
        expect(await testDataSource.getRepository(StockUnit).findOneBy({ id: unit.id })).toBeNull();
        expect(await testDataSource.getRepository(StockItem).findOneBy({ id: item.id })).not.toBeNull();
        expect(await testDataSource.getRepository(StockMovement).find()).toEqual([
            expect.objectContaining({ type: "OUT", unitId: unit.id, itemLabel: "Pâtes", locationLabel: "Cuisine", quantity: 500 }),
        ]);
        expect((await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID })).totalXp)
            .toBe(xpBefore + UserXpActionsPoints.STOCK_UNIT_TAKE);
    });

    it("DELETE /:id removes the unit with a DELETE movement", async () => {
        const { unit } = await seedUnit();

        const response = await request(app).delete(`/stocks/units/${unit.id}`);

        expect(response.status).toBe(204);
        expect(await testDataSource.getRepository(StockUnit).count()).toBe(0);
        expect(await testDataSource.getRepository(StockMovement).find()).toEqual([
            expect.objectContaining({ type: "DELETE", unitId: unit.id }),
        ]);
    });

    it.each([
        ["post", "/stocks/units/999/take"],
        ["delete", "/stocks/units/999"],
    ] as const)("%s %s returns a typed 404", async (method, path) => {
        const response = await request(app)[method](path);
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("STOCK_UNIT_NOT_FOUND");
        expect(await testDataSource.getRepository(StockMovement).count()).toBe(0);
    });
});
