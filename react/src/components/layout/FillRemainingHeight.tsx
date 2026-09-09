import { useEffect, useRef, useState } from "react";

interface FillRemainingHeightProps {
    children: React.ReactNode;
    className?: string;
    /**
     * Dans certains cas, on a de la marge en bas.
     */
    offset?: number
}

export default function FillRemainingHeight({ children, className, offset = 0 }: FillRemainingHeightProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        const update = () => {
            if (ref.current) {
                const top = ref.current.getBoundingClientRect().top;
                setHeight(window.innerHeight - top - offset);
            }
        };

        update();

        const observer = new ResizeObserver(update);
        observer.observe(document.documentElement);
        window.addEventListener("resize", update);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [offset]);

    return (
        <div
            ref={ref}
            className={`flex min-h-0 flex-col overflow-hidden ${className ?? ""}`}
            style={{ height }}
        >
            {children}
        </div>
    );
}