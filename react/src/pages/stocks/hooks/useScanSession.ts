import { useEffect, useRef, useState } from "react";
import type { StockBarcodeLookupResponse, StockItemDto } from "@chocosous/shared";
import StockBarcodeService from "@/services/stocks/StockBarcodeService";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import type { SaveStockItemPayload } from "@/services/stocks/dto/CreateStockItemDto";
import { showGlobalToast } from "@/services/GlobalToast";

export type ScanPhase = "idle" | "scanning" | "lookup" | "form" | "saving";

/** Lot d'exemplaires partageant la même date de péremption (null : sans date). */
export interface ScanLot {
    id: number;
    expirationDate: Date | null;
    copies: number;
}

export interface ScanForm {
    barcode: string;
    label: string;
    defaultUnit: string;
    imageUrl: string;
    brand: string | null;
    quantity: number;
    unit: string;
    lots: ScanLot[];
}

export const MAX_SCAN_COPIES = 100;

let nextLotId = 1;
export const createScanLot = (expirationDate: Date | null = null): ScanLot => ({
    id: nextLotId++, expirationDate, copies: 1,
});

const emptyForm = (): ScanForm => ({
    barcode: "", label: "", defaultUnit: "pack", imageUrl: "", brand: null,
    quantity: 1, unit: "pack", lots: [createScanLot()],
});

export function totalScanCopies(lots: ScanLot[]): number {
    return lots.reduce((total, lot) => total + lot.copies, 0);
}

/**
 * Retire des lots les exemplaires déjà enregistrés, dans l'ordre de création,
 * pour qu'une reprise n'ajoute que le reste.
 */
export function removeSavedCopies(lots: ScanLot[], saved: number): ScanLot[] {
    let remaining = saved;
    return lots.flatMap(lot => {
        const removed = Math.min(lot.copies, remaining);
        remaining -= removed;
        return lot.copies - removed > 0 ? [{ ...lot, copies: lot.copies - removed }] : [];
    });
}

function areLotsValid(lots: ScanLot[]): boolean {
    const total = totalScanCopies(lots);
    return lots.length > 0 && total >= 1 && total <= MAX_SCAN_COPIES
        && lots.every(lot => Number.isInteger(lot.copies) && lot.copies >= 1
            && (lot.expirationDate === null || !Number.isNaN(lot.expirationDate.getTime())));
}
const barcodeService = new StockBarcodeService();
const itemsService = new StockItemsService();
const unitsService = new StockUnitsService();

export function createScanForm(result: StockBarcodeLookupResponse, lots?: ScanLot[]): ScanForm {
    const item = result.existingItem;
    const suggestion = result.suggestion;
    const defaultUnit = item?.defaultUnit ?? suggestion?.unit ?? (suggestion?.quantity ? "" : "pack");
    return {
        ...emptyForm(), barcode: result.barcode,
        label: item ? item.label : suggestion?.label ?? "",
        defaultUnit, unit: defaultUnit,
        imageUrl: item ? item.imageUrl ?? "" : suggestion?.imageUrl ?? "",
        quantity: suggestion?.quantity ?? 1,
        brand: suggestion?.brand ?? null,
        lots: lots?.length ? lots : [createScanLot()],
    };
}

export function isSafeImageUrl(value: string): boolean {
    if (!value.trim()) return true;
    try {
        return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}

export function useScanSession() {
    const [phase, setPhase] = useState<ScanPhase>("idle");
    const [form, setForm] = useState<ScanForm>(emptyForm);
    const [existingItem, setExistingItem] = useState<Pick<StockItemDto, "id" | "label" | "barcode" | "defaultUnit" | "imageUrl"> | null>(null);
    const [addedCount, setAddedCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [saveBlocked, setSaveBlocked] = useState(false);
    const [scanAttempt, setScanAttempt] = useState(0);
    const busy = useRef(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const startScanning = (): void => {
        if (!busy.current) {
            setError(null);
            setScanAttempt(value => value + 1);
            setPhase("scanning");
        }
    };
    const stopScanning = (): void => {
        if (!busy.current) setPhase(previous => previous === "scanning" ? "idle" : previous);
    };
    const reset = (): void => {
        if (busy.current) return;
        setForm(emptyForm());
        setExistingItem(null);
        setError(null);
        setSaveBlocked(false);
        setPhase("idle");
    };
    const lookup = async (rawCode: string): Promise<void> => {
        if (busy.current || (phase === "form" && saveBlocked)) return;
        const barcode = rawCode.trim();
        if (!/^\d{8,14}$/.test(barcode)) {
            setError("Le code-barres doit contenir de 8 à 14 chiffres.");
            return;
        }
        // Depuis le formulaire, une nouvelle recherche corrige le code sans perdre les lots saisis.
        const fromForm = phase === "form";
        const keptLots = fromForm ? form.lots : undefined;
        busy.current = true;
        setError(null);
        setSaveBlocked(false);
        setPhase("lookup");
        try {
            const result = await barcodeService.lookup(barcode);
            if (!mounted.current) return;
            const item = result.existingItem;
            const suggestion = result.suggestion;
            setExistingItem(item);
            setForm(createScanForm(result, keptLots));
            if (!item && suggestion?.quantity && !suggestion.unit) {
                setError("Quantité suggérée sans unité reconnue : choisis les unités avant de valider.");
            }
            setPhase("form");
        } catch {
            if (mounted.current) {
                setError("Recherche indisponible. Réessaie avant de créer ce produit pour éviter un doublon.");
                setPhase(fromForm ? "form" : "idle");
            }
        } finally {
            busy.current = false;
        }
    };

    const save = async (locationId: number): Promise<boolean> => {
        if (busy.current || phase !== "form" || saveBlocked) return false;
        if (!form.label.trim() || form.label.trim().length > 255
            || !/^\d{8,14}$/.test(form.barcode.trim()) || !isSafeImageUrl(form.imageUrl)
            || !form.defaultUnit.trim() || form.defaultUnit.trim().length > 64
            || !form.unit.trim() || form.unit.trim().length > 64
            || !Number.isFinite(form.quantity) || form.quantity <= 0
            || !areLotsValid(form.lots)
            || !Number.isInteger(locationId) || locationId <= 0) {
            setError(`Vérifie le libellé, le code, l'URL de l'image, les unités, la quantité et le nombre d'exemplaires (1 à ${MAX_SCAN_COPIES} au total).`);
            return false;
        }
        busy.current = true;
        setPhase("saving");
        setError(null);
        let completed = 0;
        try {
            const payload: SaveStockItemPayload = {
                label: form.label.trim(), barcode: form.barcode.trim(),
                defaultUnit: form.defaultUnit.trim(), imageUrl: form.imageUrl.trim(),
            };
            let item = existingItem;
            if (!item) {
                item = await itemsService.create(payload);
            } else if (item.label !== payload.label || item.barcode !== payload.barcode
                || item.defaultUnit !== payload.defaultUnit || (item.imageUrl ?? "") !== payload.imageUrl) {
                item = await itemsService.update(item.id, payload);
            }
            if (mounted.current) setExistingItem(item);
            for (const lot of form.lots) {
                for (let index = 0; index < lot.copies; index++) {
                    if (!mounted.current) return false;
                    await unitsService.create(item.id, {
                        locationId,
                        quantity: form.quantity, unit: form.unit.trim(),
                        expirationDate: lot.expirationDate ?? undefined,
                    });
                    completed++;
                    if (mounted.current) setAddedCount(count => count + 1);
                }
            }
            if (!mounted.current) return false;
            showGlobalToast({ severity: "success", summary: "Stock ajouté", detail: `${completed} exemplaire(s) ajouté(s).` });
            setForm(emptyForm());
            setExistingItem(null);
            setScanAttempt(value => value + 1);
            setPhase("scanning");
            return true;
        } catch {
            if (mounted.current) {
                // Une réponse perdue peut masquer un ajout réussi : ne pas proposer une reprise aveugle.
                setForm(previous => ({ ...previous, lots: removeSavedCopies(previous.lots, completed) }));
                setSaveBlocked(true);
                setError(`${completed} ajout(s) confirmé(s), mais le dernier enregistrement est incertain. Vérifie les stocks avant de recommencer un scan pour éviter les doublons.`);
                setPhase("form");
            }
            return false;
        } finally {
            busy.current = false;
        }
    };

    return {
        phase, form, setForm, existingItem, addedCount, error, saveBlocked, scanAttempt,
        lookup, save, reset, startScanning, stopScanning,
    };
}
