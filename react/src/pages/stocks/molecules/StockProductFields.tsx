import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { STOCK_UNIT_UNITS, type StockUnitUnits } from "@chocosous/shared";
import { isHttpUrl, type StockItemDraft } from "@/utils/stocks/stockEntryDraft";

interface StockProductFieldsProps {
    item: StockItemDraft;
    onChange: (changes: Partial<StockItemDraft>) => void;
}

/** Détails du produit (catalogue), repliés par défaut dans le dialog de saisie. */
export default function StockProductFields({ item, onChange }: StockProductFieldsProps) {
    const showImage = item.imageUrl.trim() !== "" && isHttpUrl(item.imageUrl);

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
                <label htmlFor="stock-product-brand" className="text-sm">Marque</label>
                <InputText id="stock-product-brand" value={item.brand} maxLength={255}
                    onChange={(event) => onChange({ brand: event.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="stock-product-unit" className="text-sm">Unité par défaut</label>
                <Dropdown inputId="stock-product-unit" value={item.defaultUnit} options={[...STOCK_UNIT_UNITS]}
                    onChange={(event) => onChange({ defaultUnit: event.value as StockUnitUnits })} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
                <label htmlFor="stock-product-image" className="text-sm">Image (URL)</label>
                <div className="flex items-center gap-3">
                    <InputText id="stock-product-image" type="url" value={item.imageUrl} className="flex-1 min-w-0"
                        onChange={(event) => onChange({ imageUrl: event.target.value })} />
                    {showImage && (
                        <img src={item.imageUrl.trim()} alt="" referrerPolicy="no-referrer"
                            className="h-12 w-12 shrink-0 rounded object-contain" />
                    )}
                </div>
            </div>
        </div>
    );
}
