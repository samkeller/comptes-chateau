interface StockQuantityLabelProps {
    quantity: number;
    unit: string;
    className?: string;
}

export function formatStockQuantity(quantity: number): string {
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: Number.isInteger(quantity) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(quantity);
}

export default function StockQuantityLabel({ quantity, unit, className }: StockQuantityLabelProps) {
    return (
        <span className={className}>
            {formatStockQuantity(quantity)} {unit}
        </span>
    );
}
