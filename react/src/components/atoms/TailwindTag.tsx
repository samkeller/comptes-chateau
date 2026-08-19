import { ReactNode } from "react";

interface TailwindTagProps {
    children: ReactNode;
}

export default function TailwindTag({ children }: TailwindTagProps) {
    return (
        <span className="h-[28px] rounded-md bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            {children}
        </span>
    );
}