
interface FillRemainingHeightProps {
    children: React.ReactNode,
    className?: string,
}

export default function FillRemainingHeight({ children, className }: FillRemainingHeightProps) {
    return (
        <div className={`flex min-h-0 flex-1 flex-col ${className ?? ""}`}  >
            {children}
        </div>
    )
}