export default function FillRemainingHeight({ children, }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
                {children}
            </div>
        </div>
    )
}