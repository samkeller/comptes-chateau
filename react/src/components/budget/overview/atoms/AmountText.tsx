import { toMonetaryAmount } from "@/utils/NumberUtils";

interface AmountTextProps {
    amount: number;
    kind: "debit" | "credit";
}

export default function AmountText({ amount, kind }: AmountTextProps) {
    return (
        <span className={`font-mono font-semibold ${kind === "debit" ? "text-error" : "text-success"}`}>
            {toMonetaryAmount(amount)}
        </span>
    );
}