import { useEffect, useRef, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import type { StockItemWithLotsDto } from "@chocosous/shared";
import BarcodeScanner from "@/components/atoms/BarcodeScanner";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import { useGlobalToast } from "@/context/GlobalToastContext";
import { useScreen } from "@/hooks/useScreen";
import type StockLocation from "@/interfaces/stocks/StockLocation";
import StockBarcodeService from "@/services/stocks/StockBarcodeService";
import StockEntryService from "@/services/stocks/StockEntryService";
import StockItemsService from "@/services/stocks/StockItemsService";
import StockLotEditor from "../molecules/StockLotEditor";
import StockProductFields from "../molecules/StockProductFields";
import {
    applySuggestion, emptyEntryDraft, entryDraftFromItem, newLotDraft,
    switchToExistingItem, toSaveStockEntryDto, type StockEntryDraft, type StockItemDraft, type StockLotDraft,
} from "@/utils/stocks/stockEntryDraft";

const itemsService = new StockItemsService();
const entryService = new StockEntryService();
const barcodeService = new StockBarcodeService();

export interface StockEntryDialogRequest {
    /** Produit à modifier ; absent pour une nouvelle saisie. */
    itemId?: number;
    /** Ajoute un nouveau lot au produit (ajout rapide d'exemplaires). */
    addLot?: boolean;
    /** Ouvre directement la caméra pour scanner un code-barres. */
    scan?: boolean;
    /** Lieu sélectionné dans le tableau pour préremplir le nouveau lot. */
    defaultLocationId?: number | null;
}

interface StockEntryDialogProps {
    request: StockEntryDialogRequest;
    locations: StockLocation[];
    /** Lieu proposé pour les nouveaux lots (dernier utilisé ou filtre courant). */
    defaultLocationId: number | null;
    onClose: () => void;
    onSaved: (item: StockItemWithLotsDto, lastLocationId: number | null) => void;
}

type LookupInfo = { severity: "info" | "success"; text: string };

/**
 * Dialog unique de saisie du stock : ajout (manuel ou par scan), ajout rapide d'exemplaires et modification.
 * Le produit et ses exemplaires sont enregistrés ensemble, en une seule requête.
 */
export default function StockEntryDialog({ request, locations, defaultLocationId, onClose, onSaved }: StockEntryDialogProps) {
    const { isMobile } = useScreen();
    const showToast = useGlobalToast();

    const initialLocationId = request.defaultLocationId ?? defaultLocationId;

    const [draft, setDraft] = useState<StockEntryDraft | null>(() => request.itemId ? null : emptyEntryDraft(initialLocationId));
    const [scanning, setScanning] = useState(request.scan === true);
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupInfo, setLookupInfo] = useState<LookupInfo | null>(null);
    const [productExpanded, setProductExpanded] = useState(false);
    const [suggestions, setSuggestions] = useState<StockItemWithLotsDto[]>([]);
    const [saving, setSaving] = useState(false);
    const lastLocationId = useRef(initialLocationId);

    const isEditing = request.itemId !== undefined && !request.addLot;

    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!request.itemId) return;
        let active = true;
        itemsService.getOne(request.itemId)
            .then((item) => {
                if (active) setDraft(entryDraftFromItem(item, request.addLot ? lastLocationId.current : undefined));
            })
            // Erreur affichée par l'intercepteur : rien à modifier.
            .catch(() => { if (active) onCloseRef.current(); });
        return () => { active = false; };
    }, [request.itemId, request.addLot]);

    const updateItem = (changes: Partial<StockItemDraft>): void => {
        setDraft((current) => current && { ...current, item: { ...current.item, ...changes } });
    };
    const updateLot = (key: string, changes: Partial<StockLotDraft>): void => {
        setDraft((current) => current && {
            ...current,
            lots: current.lots.map((lot) => lot.key === key
                ? {
                    ...lot,
                    ...changes,
                    // InputNumber notifie aussi des valeurs inchangées : seule une vraie modification compte.
                    contentEdited: lot.contentEdited
                        || ("quantity" in changes && changes.quantity !== lot.quantity)
                        || ("unit" in changes && changes.unit !== lot.unit),
                }
                : lot),
        });
    };
    const removeLot = (lot: StockLotDraft): void => {
        if (lot.unitIds.length > 0) {
            updateLot(lot.key, { copies: 0 });
            return;
        }
        setDraft((current) => current && { ...current, lots: current.lots.filter((entry) => entry.key !== lot.key) });
    };
    const addLot = (): void => {
        setDraft((current) => {
            if (!current) return current;
            const model = current.lots[current.lots.length - 1];
            return {
                ...current,
                lots: [...current.lots, newLotDraft({
                    locationId: model?.locationId ?? lastLocationId.current,
                    quantity: model?.quantity,
                    unit: model?.unit ?? current.item.defaultUnit,
                })],
            };
        });
    };

    const switchToItem = (item: StockItemWithLotsDto, info: LookupInfo | null): void => {
        setDraft((current) => current
            ? switchToExistingItem(current, item, lastLocationId.current)
            : entryDraftFromItem(item, lastLocationId.current));
        setLookupInfo(info);
    };

    const lookupBarcode = async (rawCode: string): Promise<void> => {
        const code = rawCode.trim();
        setScanning(false);
        if (!code) return;
        if (draft?.item.id !== undefined) {
            // Produit déjà identifié : le scan corrige seulement son code-barres.
            updateItem({ barcode: code });
            return;
        }
        setLookingUp(true);
        try {
            const result = await barcodeService.lookup(code);
            if (result.existingItem) {
                switchToItem(result.existingItem, { severity: "success", text: "Produit déjà connu : ses lots en stock sont affichés." });
            } else {
                setDraft((current) => current && applySuggestion(current, result.barcode, result.suggestion));
                setLookupInfo(result.suggestion
                    ? { severity: "info", text: "Nouveau produit prérempli : vérifie les informations." }
                    : { severity: "info", text: "Produit inconnu : saisis son nom." });
                if (result.suggestion) setProductExpanded(true);
            }
        } catch {
            // Erreur affichée par l'intercepteur ; la saisie manuelle reste possible.
            updateItem({ barcode: code });
        } finally {
            setLookingUp(false);
        }
    };

    const searchItems = async (query: string): Promise<void> => {
        try {
            setSuggestions(await itemsService.searchByText(query, true));
        } catch {
            setSuggestions([]);
        }
    };

    const selectExistingItem = async (itemId: number): Promise<void> => {
        setLookingUp(true);
        try {
            switchToItem(await itemsService.getOne(itemId), null);
        } catch {
            // Erreur affichée par l'intercepteur.
        } finally {
            setLookingUp(false);
        }
    };

    const chooseAnotherItem = (): void => {
        setDraft(emptyEntryDraft(lastLocationId.current));
        setLookupInfo(null);
        setProductExpanded(false);
        if (request.scan) setScanning(true);
    };

    const save = async (): Promise<void> => {
        if (!draft) return;
        setSaving(true);
        try {
            const saved = await entryService.save(toSaveStockEntryDto(draft));
            const usedLots = draft.lots.filter((lot) => lot.copies > 0);
            const usedLocation = usedLots[usedLots.length - 1]?.locationId ?? null;
            onSaved(saved, usedLocation);
            showToast({ severity: "success", summary: `${saved.label} enregistré` });
            onClose();
        } catch {
            // Erreur affichée par l'intercepteur ; le formulaire reste ouvert pour corriger.
        } finally {
            setSaving(false);
        }
    };

    const busy = saving || lookingUp;
    const isNewItem = draft?.item.id === undefined;

    const footer = (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" label="Annuler" text onClick={onClose} disabled={saving} />
                <Button type="button" label="Enregistrer" icon="pi pi-check"
                    disabled={!draft || busy} loading={saving}
                    onClick={() => void save()} />
            </div>
        </div>
    );

    return (
        <Dialog visible onHide={onClose} maximized={isMobile} blockScroll
            header={isEditing ? "Modifier le produit" : "Ajouter au stock"}
            style={{ width: "min(56rem, 95vw)" }} footer={footer}>
            {!draft ? (
                <div className="flex justify-center p-8"><ProgressSpinner /></div>
            ) : (
                <div className="flex flex-col gap-4 pt-1">
                    <section className="flex flex-col gap-3" aria-label="Produit">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="stock-entry-label">Produit<RequiredMark /></label>
                            {isNewItem ? (
                                <AutoComplete inputId="stock-entry-label" value={draft.item.label} suggestions={suggestions}
                                    field="label" delay={250} inputClassName="w-full" className="w-full"
                                    placeholder="Nom du produit (existant ou nouveau)" disabled={busy} maxLength={255}
                                    completeMethod={(event) => void searchItems(event.query)}
                                    itemTemplate={(item: StockItemWithLotsDto) => (
                                        <span>{item.label}{item.brand ? ` — ${item.brand}` : ""}
                                            <span className="ml-2 text-sm text-gray-500">({item.stockUnitsCount} en stock)</span>
                                        </span>
                                    )}
                                    onChange={(event) => {
                                        if (typeof event.value === "string") updateItem({ label: event.value });
                                    }}
                                    onSelect={(event) => void selectExistingItem((event.value as StockItemWithLotsDto).id)} />
                            ) : (
                                <div className="flex gap-2">
                                    <InputText
                                        id="stock-entry-label"
                                        value={draft.item.label}
                                        maxLength={255}
                                        className="flex-1 min-w-0"
                                        onChange={(event) => updateItem({ label: event.target.value })}
                                    />
                                    {!request.itemId && (
                                        <Button
                                            type="button"
                                            icon="pi pi-times"
                                            rounded text
                                            aria-label="Choisir un autre produit"
                                            tooltip="Choisir un autre produit"
                                            tooltipOptions={{ position: 'left' }}
                                            onClick={chooseAnotherItem}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="stock-entry-barcode">Code-barres <span className="text-gray-500">(facultatif)</span></label>
                            <div className="flex gap-2">
                                <InputText id="stock-entry-barcode" inputMode="numeric" autoComplete="off" maxLength={14}
                                    className="flex-1 min-w-0" value={draft.item.barcode} disabled={busy}
                                    onChange={(event) => updateItem({ barcode: event.target.value })}
                                    onKeyDown={(event) => {
                                        if (event.key !== "Enter" || !isNewItem) return;
                                        event.preventDefault();
                                        void lookupBarcode(draft.item.barcode);
                                    }} />
                                {isNewItem && (
                                    <Button
                                        type="button"
                                        icon="pi pi-search"
                                        outlined
                                        aria-label="Rechercher ce code-barres"
                                        tooltip="Rechercher ce code-barres"
                                        tooltipOptions={{ position: 'left' }}
                                        loading={lookingUp}
                                        disabled={busy || !draft.item.barcode.trim()}
                                        onClick={() => void lookupBarcode(draft.item.barcode)}
                                    />
                                )}
                                <Button
                                    type="button"
                                    icon={scanning ? "pi pi-times" : "pi pi-camera"}
                                    rounded
                                    aria-label={scanning ? "Arrêter le scan" : "Scanner le code-barres"}
                                    tooltip={scanning ? "Arrêter le scan" : "Scanner (ou rescanner) le code-barres"}
                                    disabled={busy}
                                    onClick={() => setScanning((value) => !value)}
                                />
                            </div>
                            <BarcodeScanner active={scanning} onDetected={(code) => void lookupBarcode(code)}
                                onCancel={() => setScanning(false)} />
                        </div>

                        {lookupInfo && (
                            <Message severity={lookupInfo.severity} className="justify-start" text={(
                                <span>
                                    {lookupInfo.text}
                                </span>
                            )} />
                        )}

                        <div>
                            <Button type="button" text size="small" className="px-0"
                                icon={productExpanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                                label="Détails du produit (marque, unité, image)" aria-expanded={productExpanded}
                                aria-controls="stock-entry-product-details"
                                onClick={() => setProductExpanded((value) => !value)} />
                            {productExpanded && (
                                <div id="stock-entry-product-details" className="pt-2">
                                    <StockProductFields item={draft.item} onChange={updateItem} />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex flex-col gap-3" aria-label="Exemplaires">
                        {locations.length === 0 && (
                            <Message severity="info" className="justify-start" text="Crée d'abord un lieu de stockage." />
                        )}
                        {draft.lots.map((lot, index) => (
                            <StockLotEditor key={lot.key} lot={lot} index={index} locations={locations}
                                onChange={(changes) => updateLot(lot.key, changes)} onRemove={() => removeLot(lot)} />
                        ))}
                    </section>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            label="Ajouter"
                            icon="pi pi-plus"
                            size="small"
                            onClick={addLot}
                        />
                    </div>
                </div>
            )}
        </Dialog>
    );
}
