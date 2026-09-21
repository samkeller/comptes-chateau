

interface ColorDotProps {
    color: string;
    size?: string;
}

export default function ColorDot({ color, size }: ColorDotProps) {
    return (
        <span 
        className={`h-2.5 w-2.5 shrink-0 rounded-full inline-block`} 
        style={{ 
            backgroundColor: color,
            // Apply the size if provided
            ...(size ? { width: size, height: size } : {}),
        }} 
        />
    );
}