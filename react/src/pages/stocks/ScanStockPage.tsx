import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import BarcodeScanner from "@/components/atoms/BarcodeScanner";
import ExpirationDateScanner from "@/components/atoms/ExpirationDateScanner";
import RequiredMark from "@/components/atoms/form/RequiredMark";
import Optional from "@/components/atoms/form/Optional";
import StockLocation from "@/interfaces/stocks/StockLocation";
import { STOCK_UNIT_UNITS } from "@/interfaces/stocks/StockUnit";
import StockLocationService from "@/services/stocks/StockLocationService";
import LocalStorageUtils from "@/utils/LocalStorageUtils";
import { isSafeImageUrl, useScanSession } from "./hooks/useScanSession";

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
    const calendarRef = useRef<Calendar>(null);
    const { form, phase, setForm } = session;
    const processing = phase === "lookup" || phase === "saving";
    const hasLocation = locations.some(location => location.id === locationId);

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
            {(phase === "idle" || phase === "scanning" || phase === "lookup") && <>
                <BarcodeScanner active={phase === "scanning" && hasLocation} onDetected={code => {
                    setManualBarcode(code);
                    void session.lookup(code);
                }} />
                <Button label="Scanner un code-barres" icon="pi pi-camera" className="min-h-12"
                    disabled={!hasLocation || processing} onClick={session.startScanning} />
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
                        if (saved) setManualBarcode("");
                    });
                }}>
                    <Message severity="info" text={session.existingItem
                        ? "Produit existant : les modifications seront enregistrées."
                        : "Nouveau produit : complète les informations avant de valider."} />
                    <fieldset disabled={processing} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-barcode">Code-barres<RequiredMark /></label>
                            <InputText id="product-barcode" inputMode="numeric" value={form.barcode} maxLength={14}
                                required pattern="[0-9]{8,14}" onChange={event => setForm(previous => ({ ...previous, barcode: event.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-label">Libellé<RequiredMark /></label>
                            <InputText id="product-label" value={form.label} maxLength={255} required
                                onChange={event => setForm(previous => ({ ...previous, label: event.target.value }))} />
                            {form.brand && <small>Marque suggérée : {form.brand}</small>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="product-default-unit">Unité par défaut<RequiredMark /></label>
                            <Dropdown inputId="product-default-unit" editable options={[...STOCK_UNIT_UNITS]} value={form.defaultUnit}
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
                            <Dropdown inputId="scan-unit" editable options={[...STOCK_UNIT_UNITS]} value={form.unit}
                                onChange={event => {
                                    if (typeof event.value === "string") setForm(previous => ({ ...previous, unit: event.value }));
                                }} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="scan-expiration">Date de péremption<Optional /></label>
                            <Calendar ref={calendarRef} inputId="scan-expiration" value={form.expirationDate}
                                dateFormat="dd/mm/yy" showIcon showButtonBar
                                onChange={event => setForm(previous => ({ ...previous, expirationDate: event.value instanceof Date ? event.value : null }))} />
                            <ExpirationDateScanner disabled={processing}
                                onDetected={date => setForm(previous => ({ ...previous, expirationDate: date }))}
                                onManualEntry={() => calendarRef.current?.getInput()?.focus()} />
                            <small>Vérifie toujours la date proposée avant de valider.</small>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="scan-copies">Nombre d'exemplaires<RequiredMark /></label>
                            <InputNumber inputId="scan-copies" value={form.copies} min={1} max={100} showButtons
                                onValueChange={event => setForm(previous => ({ ...previous, copies: event.value ?? 0 }))} />
                        </div>
                    </fieldset>
                    <Button type="submit" label="Ajouter au stock" icon="pi pi-check" loading={phase === "saving"}
                        disabled={processing || !hasLocation || !form.label.trim()} className="min-h-12" />
                    <Button type="button" label="Annuler / produit suivant" outlined disabled={processing}
                        onClick={() => { session.reset(); setManualBarcode(""); session.startScanning(); }} />
                </form>}
        </section>
    );
}
