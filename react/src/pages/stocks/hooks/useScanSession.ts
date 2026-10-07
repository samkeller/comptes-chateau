import { useEffect, useRef, useState } from "react";
import type { StockItemDto } from "@chocosous/shared";
import StockBarcodeService from "@/services/stocks/StockBarcodeService";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockUnitsService from "@/services/stocks/StockUnitsService";
import type { SaveStockItemPayload } from "@/services/stocks/dto/CreateStockItemDto";
import { showGlobalToast } from "@/services/GlobalToast";

export type ScanPhase = "idle" | "scanning" | "lookup" | "form" | "saving";

export interface ScanForm {
    barcode: string;
    label: string;
    defaultUnit: string;
    imageUrl: string;
    brand: string | null;
    quantity: number;
    unit: string;
    expirationDate: Date | null;
    copies: number;
}

const emptyForm = (): ScanForm => ({
    barcode: "", label: "", defaultUnit: "pack", imageUrl: "", brand: null,
    quantity: 1, unit: "pack", expirationDate: null, copies: 1,
});
const barcodeService = new StockBarcodeService();
const itemsService = new StockItemsService();
const unitsService = new StockUnitsService();

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
    const busy = useRef(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const startScanning = (): void => {
        if (!busy.current) {
            setError(null);
            setPhase("scanning");
        }
    };
    const reset = (): void => {
        if (busy.current) return;
        setForm(emptyForm());
        setExistingItem(null);
        setError(null);
        setPhase("idle");
    };
    const lookup = async (rawCode: string): Promise<void> => {
        if (busy.current) return;
        const barcode = rawCode.trim();
        if (!/^\d{8,14}$/.test(barcode)) {
            setError("Le code-barres doit contenir de 8 à 14 chiffres.");
            return;
        }
        busy.current = true;
        setError(null);
        setPhase("lookup");
        try {
            const result = await barcodeService.lookup(barcode);
            if (!mounted.current) return;
            const item = result.existingItem;
            const suggestion = result.suggestion;
            const defaultUnit = item?.defaultUnit ?? suggestion?.unit ?? "pack";
            setExistingItem(item);
            setForm({
                ...emptyForm(), barcode,
                label: item ? item.label : suggestion?.label ?? "",
                defaultUnit, unit: defaultUnit,
                imageUrl: item ? item.imageUrl ?? "" : suggestion?.imageUrl ?? "",
                quantity: suggestion?.quantity ?? 1,
                brand: suggestion?.brand ?? null,
            });
            setPhase("form");
        } catch {
            if (mounted.current) {
                setError("Recherche indisponible. Réessaie avant de créer ce produit pour éviter un doublon.");
                setPhase("idle");
            }
        } finally {
            busy.current = false;
        }
    };

    const save = async (locationId: number): Promise<boolean> => {
        if (busy.current || phase !== "form") return false;
        if (!form.label.trim() || form.label.trim().length > 255
            || !/^\d{8,14}$/.test(form.barcode.trim()) || !isSafeImageUrl(form.imageUrl)
            || !form.defaultUnit.trim() || form.defaultUnit.trim().length > 64
            || !form.unit.trim() || form.unit.trim().length > 64
            || !Number.isFinite(form.quantity) || form.quantity <= 0
            || !Number.isInteger(form.copies) || form.copies < 1 || form.copies > 100
            || !Number.isInteger(locationId) || locationId <= 0
            || (form.expirationDate !== null && Number.isNaN(form.expirationDate.getTime()))) {
            setError("Vérifie le libellé, le code, l'URL de l'image, la quantité et le nombre d'exemplaires (1 à 100).");
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
            for (let index = 0; index < form.copies; index++) {
                if (!mounted.current) return false;
                await unitsService.create(item.id, {
                    clientId: crypto.randomUUID(), locationId,
                    quantity: form.quantity, unit: form.unit.trim(),
                    expirationDate: form.expirationDate ?? undefined,
                });
                completed++;
                if (mounted.current) setAddedCount(count => count + 1);
            }
            if (!mounted.current) return false;
            showGlobalToast({ severity: "success", summary: "Stock ajouté", detail: `${completed} exemplaire(s) ajouté(s).` });
            setForm(emptyForm());
            setExistingItem(null);
            setPhase("scanning");
            return true;
        } catch {
            if (mounted.current) {
                // Une reprise ne doit recréer ni le produit ni les exemplaires déjà enregistrés.
                setForm(previous => ({ ...previous, copies: previous.copies - completed }));
                setError(`${completed} exemplaire(s) ajouté(s). Réessaie pour enregistrer les exemplaires restants.`);
                setPhase("form");
            }
            return false;
        } finally {
            busy.current = false;
        }
    };

    return { phase, form, setForm, existingItem, addedCount, error, lookup, save, reset, startScanning };
}
