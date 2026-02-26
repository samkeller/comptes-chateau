interface ColoredLabelProps {
    data: {
        label: string;
        color: string;
    }
}

export function ColoredLabel({ data }: ColoredLabelProps) {
    return (
        <div className="flex align-items-center">
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
