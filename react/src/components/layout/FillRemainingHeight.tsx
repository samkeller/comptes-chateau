

export default function FillRemainingHeight({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </div>
    )
}