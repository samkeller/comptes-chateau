import { StockLotDto } from "@chocosous/shared";
import { parseApiDate, parseDateToDDMMYYYY } from "@/utils/DatesUtils";
import { STOCK_EXPIRY_DISPLAY } from "@/utils/stocks/stockExpiry";
import { Tag } from "primereact/tag";

interface StockExpiryDateTagProps {
    lot: StockLotDto
}

export default function StockExpiryDateTag({ lot }: StockExpiryDateTagProps) {

    const date = parseApiDate(lot.expirationDate);
    if (!date) return <></>;

    const display = STOCK_EXPIRY_DISPLAY[lot.expiryState];

    const text = parseDateToDDMMYYYY(date);

    return (
        display.severity
            ? <Tag severity={display.severity} value={text} title={display.label} />
            : <span className="text-sm">{text}</span>
    )
}