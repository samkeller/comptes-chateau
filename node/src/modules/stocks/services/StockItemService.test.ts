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
            units: [],
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
            units: [],
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

});