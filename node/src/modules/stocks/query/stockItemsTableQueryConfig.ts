import { Brackets } from "typeorm";
import { barcodeVariants, normalizeBarcode, STOCK_EXPIRY_STATES, type StockExpiryState } from "@chocosous/shared";
import { badRequest } from "../../../utils/AppError";
import {
    createOrderBySortHandler,
    createTextSimpleFilterHandler,
    type TableFilterHandler,
    type TableQueryMapperConfig,
} from "../../../utils/tableQuery/TableQueryMapper";
import type { ExpiryBounds } from "../mappers/StockLotMapper";
import { StockItem } from "../entities/StockItem";

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function simpleTextValue(value: unknown): string {
    if (typeof value !== "string") {
        throw badRequest("QUERY_VALIDATION", "A text filter must contain a string value.");
    }
    return value;
}

function parseLocationId(value: unknown): number {
    const locationId = Number(value);
    if (!Number.isSafeInteger(locationId) || locationId <= 0) {
        throw badRequest("QUERY_VALIDATION", "The location filter must be a positive integer.");
    }
    return locationId;
}

function parseExpiryState(value: unknown): StockExpiryState {
    if (typeof value !== "string" || !(STOCK_EXPIRY_STATES as readonly string[]).includes(value)) {
        throw badRequest("QUERY_VALIDATION", "The expiration filter is invalid.");
    }
    return value as StockExpiryState;
}

function expirySql(state: StockExpiryState, alias: string): string {
    switch (state) {
        case "expired": return `${alias}."expirationDate" < :stockToday`;
        case "soon": return `${alias}."expirationDate" BETWEEN :stockToday AND :stockSoonLimit`;
        case "ok": return `${alias}."expirationDate" > :stockSoonLimit`;
        case "none": return `${alias}."expirationDate" IS NULL`;
    }
}

export interface StockItemsQueryContext {
    bounds: ExpiryBounds;
    includeEmpty: boolean;
    locationId: number | null;
    expiryState: StockExpiryState | null;
}

export function createStockItemsTableQueryConfig(
    context: StockItemsQueryContext
): TableQueryMapperConfig<StockItem> {
    const globalSearchHandler: TableFilterHandler<StockItem> = {
        applySimple: (queryBuilder, filter) => {
            const raw = simpleTextValue(filter.value).trim();
            if (!raw) return;

            const pattern = `%${escapeLike(raw)}%`;
            const barcode = normalizeBarcode(raw);
            queryBuilder.andWhere(new Brackets((where) => {
                where.where("item.label ILIKE :stockGlobal", { stockGlobal: pattern })
                    .orWhere("item.brand ILIKE :stockGlobal", { stockGlobal: pattern });
                if (barcode) {
                    where.orWhere("item.barcode IN (:...stockBarcodeVariants)", {
                        stockBarcodeVariants: barcodeVariants(barcode),
                    });
                } else {
                    where.orWhere("item.barcode ILIKE :stockGlobal", { stockGlobal: pattern });
                }
            }));
        },
    };

    const locationFilter: TableFilterHandler<StockItem> = {
        applySimple: (queryBuilder, filter) => {
            const locationId = parseLocationId(filter.value);
            if (context.includeEmpty) return;
            queryBuilder.andWhere('"filterUnit"."locationId" = :stockLocationId', { stockLocationId: locationId });
        },
    };

    const expiryFilter: TableFilterHandler<StockItem> = {
        applySimple: (queryBuilder, filter) => {
            const state = parseExpiryState(filter.value);
            queryBuilder.andWhere(expirySql(state, '"filterUnit"'), {
                stockToday: context.bounds.today,
                stockSoonLimit: context.bounds.soonLimit,
            });
        },
    };

    return {
        defaultSort: { field: "label", direction: "ASC" },
        sortHandlers: {
            label: createOrderBySortHandler("item.label", "item.id"),
            brand: createOrderBySortHandler("item.brand", "item.label"),
        },
        filterHandlers: {
            global: globalSearchHandler,
            label: createTextSimpleFilterHandler("item.label", "stockLabel"),
            brand: createTextSimpleFilterHandler("item.brand", "stockBrand"),
            barcode: createTextSimpleFilterHandler("item.barcode", "stockBarcode"),
            locationId: locationFilter,
            expiryState: expiryFilter,
        },
    };
}