interface ColoredLabelProps {
    data: {
        id: number;
        label: string;
        color: string;
    }
}

export function ColoredLabel({ data }: ColoredLabelProps) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center" }}>
            <span
                aria-hidden="true"
                style={{
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "0.5rem",
                    background: data.color,
                    display: "inline-block",
                }}
            />
            <span className="ml-1">{data.label}</span>
        </div>
    )
}
