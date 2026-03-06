
interface BooleanIconProps {
    value: boolean
}

export function BooleanIcon({ value }: BooleanIconProps) {
    return value ?
        <i className="pi pi-check text-green-500"></i> :
        <i className="pi pi-times text-red-500"></i>
}
