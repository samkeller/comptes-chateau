import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Link } from "react-router-dom";
import { routePaths } from "@/routes/routePaths";
import BarcodeScanner from "@/components/atoms/BarcodeScanner";
import ExpirationDateScanner from "@/components/atoms/ExpirationDateScanner";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import Optional from "@/components/atoms/form/Optional";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import StockLocationService from "@/services/stocks/StockLocationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import {
    createScanLot, isSafeImageUrl, MAX_SCAN_COPIES, totalScanCopies, useScanSession, type ScanLot,
} from "./hooks/useScanSession";

const locationService = new StockLocationService();

function rememberedLocation(): number | null {
    try { return new LocalStorageUtils().getScanLocationId(); } catch { return null; }
}

export default function ScanStockPage() {
    const session = useScanSession();
    const [locations, setLocations] = useState<StockLocation[]>([]);
    const [locationId, setLocationId] = useState<number | null>(rememberedLocation);
    const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
    const [locationsReload, setLocationsReload] = useState(0);
    const [manualBarcode, setManualBarcode] = useState("");
    const [rescanning, setRescanning] = useState(false);
    const { form, phase, setForm } = session;
    const processing = phase === "lookup" || phase === "saving";
    const hasLocation = locations.some(location => location.id === locationId);
    const totalCopies = totalScanCopies(form.lots);

    useEffect(() => {
        let disposed = false;
        void locationService.listLocations().then(values => {
            if (disposed) return;
            setLocations(values);
            setLocationId(previous => values.some(location => location.id === previous) ? previous : null);
            setLocationsStatus("ready");
        }).catch(() => { if (!disposed) setLocationsStatus("error"); });
        return () => { disposed = true; };
    }, [locationsReload]);

    const chooseLocation = (id: number): void => {
        setLocationId(id);
        try { new LocalStorageUtils().setScanLocationId(id); } catch { /* Stockage local facultatif. */ }
    };
    const changeDefaultUnit = (unit: string): void => {
        setForm(previous => ({
            ...previous, defaultUnit: unit,
            unit: previous.unit === previous.defaultUnit ? unit : previous.unit,
        }));
    };
    const updateLot = (id: number, changes: Partial<Omit<ScanLot, "id">>): void => {
        setForm(previous => ({
            ...previous, lots: previous.lots.map(lot => lot.id === id ? { ...lot, ...changes } : lot),
        }));
    };
    const addLot = (): void => {
        setForm(previous => ({ ...previous, lots: [...previous.lots, createScanLot()] }));
    };
    const removeLot = (id: number): void => {
        setForm(previous => ({ ...previous, lots: previous.lots.filter(lot => lot.id !== id) }));
    };
    const relookup = (code: string): void => {
        setRescanning(false);
        setForm(previous => ({ ...previous, barcode: code }));
        void session.lookup(code);
    };

    return (
        <section className="flex flex-col gap-4 w-full max-w-xl mx-auto p-2" aria-label="Scan rapide">
            <h2 className="text-xl font-semibold">Scan rapide</h2>
            <p aria-live="polite">{session.addedCount} produits ajoutés cette session</p>
            <div className="flex flex-col gap-2">
                <label htmlFor="scan-location">Lieu de stockage<RequiredMark /></label>
                <Dropdown inputId="scan-location" value={hasLocation ? locationId : null}
                    options={locations} optionLabel="label" optionValue="id" placeholder="Choisir le lieu"
                    loading={locationsStatus === "loading"} disabled={processing}
                    onChange={event => chooseLocation(event.value as number)} />
                {locationsStatus === "error" && <>
                    <Message severity="error" text="Impossible de charger les lieux." />
                    <Button label="Réessayer" outlined onClick={() => {
                        setLocationsStatus("loading");
                        setLocationsReload(value => value + 1);
                    }} />
                </>}
                {locationsStatus === "ready" && locations.length === 0 &&
                    <Message severity="info" text="Crée d'abord un lieu dans la gestion des stocks." />}
            </div>
            {session.error && <Message severity="warn" text={session.error} />}
            {session.saveBlocked && <Link className="underline p-2" to={routePaths.stocks.stocksManagement}>
                Vérifier les stocks enregistrés
            </Link>}
            {(phase === "idle" || phase === "scanning" || phase === "lookup") && <>
                <BarcodeScanner key={session.scanAttempt} active={phase === "scanning" && hasLocation}
                    onCancel={session.stopScanning} onDetected={code => {
                        setManualBarcode(code);
                        void session.lookup(code);
                    }} />
                {phase !== "scanning" && <Button label="Scanner un code-barres" icon="pi pi-camera" className="min-h-12"
                    disabled={!hasLocation || processing} onClick={session.startScanning} />}
                <form className="flex flex-col gap-2" onSubmit={event => {
                    event.preventDefault();
                    void session.lookup(manualBarcode);
                }}>
                    <label htmlFor="scan-barcode">Code-barres (saisie manuelle)<RequiredMark /></label>
                    <InputText id="scan-barcode" inputMode="numeric" autoComplete="off" maxLength={14}
                        value={manualBarcode} disabled={processing}
                        onChange={event => setManualBarcode(event.target.value)} />
                    <Button type="submit" label="Rechercher le produit" loading={phase === "lookup"}
                        disabled={!hasLocation || !manualBarcode.trim() || processing} className="min-h-12" />
                </form>
            </>}
            {(phase === "form" || phase === "saving") &&
                <form className="flex flex-col gap-4" onSubmit={event => {
                    event.preventDefault();
                    if (hasLocation && locationId) void session.save(locationId).then(saved => {
                        if (saved) {
                            setManualBarcode("");
                            setRescanning(false);
                        }
                    });
                }}>
                    <Message severity="info" text={session.existingItem
                        ? "Produit existant : les modifications seront enregistrées."
                        : "Nouveau produit : complète les informations avant de valider."} />
                    <fieldset disabled={processing} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-barcode">Code-barres<RequiredMark /></label>
                            <div className="flex gap-2">
                                <InputText id="product-barcode" inputMode="numeric" value={form.barcode} maxLength={14}
                                    className="flex-1 min-w-0" required pattern="[0-9]{8,14}"
                                    onChange={event => setForm(previous => ({ ...previous, barcode: event.target.value }))} />
                                <Button type="button" icon="pi pi-search" outlined aria-label="Rechercher ce code-barres"
                                    tooltip="Rechercher ce code-barres" disabled={session.saveBlocked}
                                    onClick={() => relookup(form.barcode)} />
                                <Button type="button" icon="pi pi-camera" outlined aria-label="Scanner à nouveau le code-barres"
                                    tooltip="Scanner à nouveau" disabled={session.saveBlocked}
                                    onClick={() => setRescanning(value => !value)} />
                            </div>
                            <BarcodeScanner active={rescanning && !session.saveBlocked} onDetected={relookup}
                                onCancel={() => setRescanning(false)} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-label">Libellé<RequiredMark /></label>
                            <InputText id="product-label" value={form.label} maxLength={255} required
                                onChange={event => setForm(previous => ({ ...previous, label: event.target.value }))} />
                            {form.brand && <small>Marque suggérée : {form.brand}</small>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-default-unit">Unité par défaut<RequiredMark /></label>
                            <Dropdown inputId="product-default-unit" editable placeholder="Choisir l'unité"
                                options={[...STOCK_UNIT_UNITS]} value={form.defaultUnit}
                                onChange={event => { if (typeof event.value === "string") changeDefaultUnit(event.value); }} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-image">URL de l'image<Optional /></label>
                            <InputText id="product-image" value={form.imageUrl} type="url"
                                onChange={event => setForm(previous => ({ ...previous, imageUrl: event.target.value }))} />
                            {form.imageUrl.trim() && isSafeImageUrl(form.imageUrl) &&
                                <img src={form.imageUrl.trim()} alt={form.label || "Produit"} referrerPolicy="no-referrer"
                                    className="h-24 object-contain self-start" />}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="scan-quantity">Quantité par exemplaire<RequiredMark /></label>
                            <InputNumber inputId="scan-quantity" value={form.quantity} min={0.001} maxFractionDigits={3}
                                onValueChange={event => setForm(previous => ({ ...previous, quantity: event.value ?? 0 }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="scan-unit">Unité de stock<RequiredMark /></label>
                            <Dropdown inputId="scan-unit" editable placeholder="Choisir l'unité"
                                options={[...STOCK_UNIT_UNITS]} value={form.unit}
                                onChange={event => {
                                    if (typeof event.value === "string") setForm(previous => ({ ...previous, unit: event.value }));
                                }} />
                        </div>
                        <fieldset className="flex flex-col gap-3">
                            <legend className="mb-2">Exemplaires<RequiredMark /></legend>
                            {form.lots.map((lot, index) => {
                                const dateInputId = `scan-expiration-${lot.id}`;
                                return <div key={lot.id} className="flex flex-col gap-2 border-1 border-gray-300 rounded-lg p-3"
                                    aria-label={`Lot ${index + 1}`} role="group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">Lot {index + 1}</span>
                                        {form.lots.length > 1 && <Button type="button" icon="pi pi-trash" text severity="danger"
                                            aria-label={`Retirer le lot ${index + 1}`} onClick={() => removeLot(lot.id)} />}
                                    </div>
                                    <label htmlFor={`scan-copies-${lot.id}`}>Nombre d'exemplaires<RequiredMark /></label>
                                    <InputNumber inputId={`scan-copies-${lot.id}`} value={lot.copies} min={1}
                                        max={MAX_SCAN_COPIES} showButtons
                                        onValueChange={event => updateLot(lot.id, { copies: event.value ?? 0 })} />
                                    <label htmlFor={dateInputId}>Date de péremption<Optional /></label>
                                    <Calendar inputId={dateInputId} value={lot.expirationDate}
                                        dateFormat="dd/mm/yy" showIcon showButtonBar placeholder="Aucune date"
                                        onChange={event => updateLot(lot.id, {
                                            expirationDate: event.value instanceof Date ? event.value : null,
                                        })} />
                                    <ExpirationDateScanner disabled={processing}
                                        onDetected={date => updateLot(lot.id, { expirationDate: date })}
                                        onManualEntry={() => document.getElementById(dateInputId)?.focus()} />
                                </div>;
                            })}
                            <Button type="button" label="Ajouter un lot (autre date ou sans date)" icon="pi pi-plus" outlined
                                disabled={totalCopies >= MAX_SCAN_COPIES} onClick={addLot} />
                            <small>
                                {totalCopies} exemplaire(s) au total (maximum {MAX_SCAN_COPIES}). Laisse la date vide
                                pour un produit sans péremption, et vérifie toujours la date proposée avant de valider.
                            </small>
                        </fieldset>
                    </fieldset>
                    <Button type="submit" label="Ajouter au stock" icon="pi pi-check" loading={phase === "saving"}
                        disabled={processing || session.saveBlocked || !hasLocation || !form.label.trim()
                            || !form.defaultUnit.trim() || !form.unit.trim()
                        || totalCopies < 1 || totalCopies > MAX_SCAN_COPIES} className="min-h-12" />
                    <Button type="button" label={session.saveBlocked ? "Recommencer après vérification" : "Annuler / produit suivant"} outlined disabled={processing}
                        onClick={() => { setRescanning(false); session.reset(); setManualBarcode(""); session.startScanning(); }} />
                </form>}
        </section>
    );
}
