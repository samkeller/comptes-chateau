import { z } from "zod";

const optionalTextField = (maxLength: number) =>
    z.union([
        z.string().trim().max(maxLength),
        z.literal(""),
    ]).optional().nullable();

const optionalDateField = z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(""),
]).optional().nullable();

export interface StockIntakeLineDto {
    label: string;
    barcode?: string | null;
    unit: string;
    quantity: number;
    expirationDate?: string | null;
    imageUrl?: string | null;
    unitLabel?: string | null;
}

export interface StockIntakeDto {
    locationId: number;
    occurredAt?: Date;
    source?: string | null;
    lines: StockIntakeLineDto[];
}

export const StockUnitIntakeSchema = z.object({
    locationId: z.number().int().positive(),
    occurredAt: z.coerce.date().optional(),
    source: optionalTextField(50),
    lines: z.array(z.object({
        label: z.string().trim().min(1).max(255),
        barcode: optionalTextField(64),
        unit: z.string().trim().min(1).max(64),
        quantity: z.number().positive().default(1),
        expirationDate: optionalDateField,
        imageUrl: optionalTextField(2048),
        unitLabel: optionalTextField(255),
    })).min(1),
});
