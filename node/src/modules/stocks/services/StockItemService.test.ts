import { beforeAll, describe, expect, it } from "vitest";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import type { Repository } from "typeorm";
import { StockItem } from "../entities/StockItem";
import StockItemService from "./StockItemService";
import { User } from "../../core/entities/User";
import { UserXpActionsPoints } from "../../core/utils/UserXPUtils";

describe("StockItemService.create", () => {

    let stockItemService: StockItemService;
    let stockItemRepo: Repository<StockItem>;
    let userRepo: Repository<User>;

    beforeAll(() => {
        stockItemService = new StockItemService(testDataSource.manager);
        stockItemRepo = testDataSource.manager.getRepository(StockItem);
        userRepo = testDataSource.manager.getRepository(User);
    });

    it("should create a new stock item", async () => {
        await stockItemService.create({
            label: "Test Item",
            defaultUnit: "pcs",
            barcode: "123456789",
        }, TEST_USER_ID);

        const createdItem = await stockItemRepo.findOne({
            where: {
                label: "Test Item",
            },
        });

        // Assert
        expect(createdItem).toBeDefined();
        expect(createdItem).not.toBeNull();
        expect(createdItem!.label).toBe("Test Item");
        expect(createdItem!.defaultUnit).toBe("pcs");
        expect(createdItem!.barcode).toBe("123456789");
    });

    it("should give the user XP", async () => {
        const userBefore = await userRepo.findOne({
            where: {
                id: TEST_USER_ID,
            },
        });

        const createdItem = await stockItemService.create({
            label: "Test Item",
            defaultUnit: "pcs",
            barcode: "123456789",
        }, TEST_USER_ID);


        const userXPAfter = (await userRepo.findOne({
            where: {
                id: TEST_USER_ID,
            },
        }))?.totalXp;

        expect(userBefore?.id).toBe(1);
        expect(createdItem.id).toBe(1);
        expect(userXPAfter).toBeDefined();
        expect(userXPAfter).toEqual(userBefore!.totalXp + UserXpActionsPoints.STOCK_ITEM_CREATED);
    });

    it("returns null when no item matches the barcode", async () => {
        expect(await stockItemService.findByBarcode("0012345678901")).toBeNull();
    });

    it("selects the latest createdAt then the highest id for duplicate barcodes", async () => {
        const barcode = "0012345678901";
        await stockItemRepo.save([
            { label: "Old", defaultUnit: "g", barcode, createdAt: new Date("2025-01-01") },
            { label: "Newest first", defaultUnit: "g", barcode, createdAt: new Date("2026-01-01") },
            { label: "Newest last", defaultUnit: "g", barcode, createdAt: new Date("2026-01-01") },
            { label: "Old last", defaultUnit: "g", barcode, createdAt: new Date("2024-01-01") },
        ]);
        expect(await stockItemService.findByBarcode(barcode)).toEqual({
            id: 3, label: "Newest last", barcode, defaultUnit: "g", imageUrl: null,
            stockUnitsCount: 0, nextStockUnitExpiration: null, createdAt: "2026-01-01T00:00:00.000Z",
        });
    });

});