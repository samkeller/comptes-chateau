import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";
import { User } from "../../core/entities/User";
import { UserXpActionsPoints } from "../../core/utils/UserXPUtils";
import { StockItem } from "../entities/StockItem";
import { StockLocation } from "../entities/StockLocation";
import { StockMovement } from "../entities/StockMovement";
import { StockUnit } from "../entities/StockUnit";

describe("StockEntryRoutes integration", () => {
    let app: ReturnType<typeof createTestApp>;
    let kitchen: StockLocation;
    let cellar: StockLocation;

    beforeAll(async () => {
        const { default: stockRoutes } = await import("./StockRoutes");
        app = createTestApp("/stocks", stockRoutes);
    });

    beforeEach(async () => {
        [kitchen, cellar] = await testDataSource.getRepository(StockLocation).save([{ label: "Cuisine" }, { label: "Cave" }]);
    });

    const totalXp = async () => (await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID })).totalXp;
    const movements = () => testDataSource.getRepository(StockMovement).find({ order: { id: "ASC" } });

    function lot(overrides: Record<string, unknown> = {}) {
        return { copies: 1, locationId: kitchen.id, quantity: 500, unit: "g", expirationDate: null, ...overrides };
    }

    async function createRice() {
        const response = await request(app).post("/stocks/entries").send({
            item: { label: "Riz", defaultUnit: "g", barcode: "012345678905" },
            lots: [
                lot({ copies: 3, expirationDate: "2027-01-10" }),
                lot({ copies: 1, expirationDate: null }),
            ],
        });
        expect(response.status).toBe(201);
        return response.body;
    }

    it("creates a product and several lots (with or without date) in one call", async () => {
        const xpBefore = await totalXp();
        const body = await createRice();

        expect(body).toMatchObject({ label: "Riz", barcode: "0012345678905", defaultUnit: "g", stockUnitsCount: 4 });
        expect(body.lots.map((l: { expirationDate: string | null; unitIds: number[] }) => [l.expirationDate, l.unitIds.length]))
            .toEqual([["2027-01-10", 3], [null, 1]]);
        expect((await movements()).map((m) => [m.type, m.itemLabel, m.locationLabel])).toEqual(
            Array(4).fill(["IN", "Riz", "Cuisine"]),
        );
        expect(await totalXp()).toBe(xpBefore + UserXpActionsPoints.STOCK_ITEM_CREATED + 4 * UserXpActionsPoints.STOCK_UNIT_CREATED);
    });

    it("adds copies to an existing product without re-creating it", async () => {
        const rice = await createRice();
        const response = await request(app).post("/stocks/entries").send({
            item: { id: rice.id, label: "Riz", defaultUnit: "g" },
            lots: [lot({ copies: 2, locationId: cellar.id })],
        });
        expect(response.status).toBe(200);
        expect(response.body.stockUnitsCount).toBe(6);
        expect(await testDataSource.getRepository(StockItem).count()).toBe(1);
    });

    it("edits existing lots: adds, removes newest copies, adjusts fields, never mutating IN movements", async () => {
        const rice = await createRice();
        const [dated, undated] = rice.lots as { unitIds: number[] }[];
        const inBefore = await testDataSource.getRepository(StockMovement).findBy({ type: "IN" });

        const response = await request(app).post("/stocks/entries").send({
            item: { id: rice.id, label: "Riz basmati", defaultUnit: "g" },
            lots: [
                lot({ unitIds: dated.unitIds, copies: 1, expirationDate: "2027-01-10" }),
                lot({ unitIds: undated.unitIds, copies: 2, locationId: cellar.id, quantity: 1, unit: "kg", expirationDate: null }),
            ],
        });

        expect(response.status).toBe(200);
        expect(response.body.label).toBe("Riz basmati");
        expect(response.body.lots.map((l: { locationLabel: string; quantity: number; unitIds: number[] }) => [l.locationLabel, l.quantity, l.unitIds]))
            .toEqual([["Cuisine", 500, [dated.unitIds[0]]], ["Cave", 1, [undated.unitIds[0], expect.any(Number)]]]);

        const all = await movements();
        expect(all.filter((m) => m.type === "DELETE").map((m) => m.unitId)).toEqual(dated.unitIds.slice(1));
        expect(all.filter((m) => m.type === "ADJUST")).toEqual([
            expect.objectContaining({ unitId: undated.unitIds[0], locationLabel: "Cave", quantity: 1, unit: "kg", itemLabel: "Riz basmati" }),
        ]);
        expect(all.filter((m) => m.type === "IN")).toHaveLength(5);
        expect(await testDataSource.getRepository(StockMovement).findBy({ type: "IN", id: inBefore[0].id }))
            .toEqual([inBefore[0]]);
    });

    it("removes a whole lot with copies = 0 and keeps the product findable", async () => {
        const rice = await createRice();
        const response = await request(app).post("/stocks/entries").send({
            item: { id: rice.id, label: "Riz", defaultUnit: "g" },
            lots: rice.lots.map((l: { unitIds: number[]; expirationDate: string | null }) => lot({ unitIds: l.unitIds, copies: 0, expirationDate: l.expirationDate })),
        });
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ stockUnitsCount: 0, lots: [] });
        expect(await testDataSource.getRepository(StockItem).count()).toBe(1);
        const found = await request(app).get("/stocks/items").query({ includeEmpty: "true", search: "riz" });
        expect(found.body.map((item: { id: number }) => item.id)).toEqual([rice.id]);
    });

    it("rolls back everything when a location does not exist", async () => {
        const response = await request(app).post("/stocks/entries").send({
            item: { label: "Pâtes", defaultUnit: "g" },
            lots: [lot(), lot({ locationId: 999 })],
        });
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("STOCK_LOCATION_NOT_FOUND");
        expect(await testDataSource.getRepository(StockItem).count()).toBe(0);
        expect(await testDataSource.getRepository(StockUnit).count()).toBe(0);
        expect(await movements()).toEqual([]);
    });

    it("refuses units that belong to another product or no longer exist", async () => {
        const rice = await createRice();
        const other = await request(app).post("/stocks/entries").send({ item: { label: "Sel", defaultUnit: "g" }, lots: [] });

        const mismatch = await request(app).post("/stocks/entries").send({
            item: { id: other.body.id, label: "Sel", defaultUnit: "g" },
            lots: [lot({ unitIds: rice.lots[0].unitIds, copies: 0 })],
        });
        expect(mismatch.status).toBe(400);
        expect(mismatch.body.code).toBe("STOCK_UNIT_ITEM_MISMATCH");

        const gone = await request(app).post("/stocks/entries").send({
            item: { id: rice.id, label: "Riz", defaultUnit: "g" },
            lots: [lot({ unitIds: [9999], copies: 1 })],
        });
        expect(gone.status).toBe(404);
        expect(gone.body.code).toBe("STOCK_UNIT_NOT_FOUND");
        expect(await testDataSource.getRepository(StockUnit).count()).toBe(4);
    });

    it.each([
        ["an unknown unit", { item: { label: "X", defaultUnit: "brouette" }, lots: [] }],
        ["an invalid barcode", { item: { label: "X", defaultUnit: "g", barcode: "12ab" }, lots: [] }],
        ["a non-http image", { item: { label: "X", defaultUnit: "g", imageUrl: "javascript:alert(1)" }, lots: [] }],
        ["an empty new lot", { item: { label: "X", defaultUnit: "g" }, lots: [{ copies: 0, locationId: 1, quantity: 1, unit: "g", expirationDate: null }] }],
        ["more than 100 new copies", { item: { label: "X", defaultUnit: "g" }, lots: [{ copies: 101, locationId: 1, quantity: 1, unit: "g", expirationDate: null }] }],
        ["a malformed date", { item: { label: "X", defaultUnit: "g" }, lots: [{ copies: 1, locationId: 1, quantity: 1, unit: "g", expirationDate: "10/01/2027" }] }],
        ["existing units on a new product", { item: { label: "X", defaultUnit: "g" }, lots: [{ unitIds: [1], copies: 1, locationId: 1, quantity: 1, unit: "g", expirationDate: null }] }],
    ])("rejects %s with a validation error", async (_case, body) => {
        const response = await request(app).post("/stocks/entries").send(body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("accepts legacy unit aliases and stores the canonical unit", async () => {
        const response = await request(app).post("/stocks/entries").send({
            item: { label: "Biscuits", defaultUnit: "paquet" },
            lots: [lot({ unit: "boite", quantity: 1 })],
        });
        expect(response.status).toBe(201);
        expect(response.body.defaultUnit).toBe("pièce");
        expect(response.body.lots[0].unit).toBe("pièce");
    });
});
