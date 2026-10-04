import { InputText, InputTextProps } from 'primereact/inputtext';


/**
 * Pour le moment, primereact ne fournit pas de composant de recherche intégré, donc nous créons un composant personnalisé pour ajouter une icone de recherche.
 * @param props 
 * @returns 
 */
export default function InputSearch(props: InputTextProps) {
    return (
        <span className="relative">
            <i className="pi pi-search absolute left-2 top-1/2 transform -translate-y-1/2" />
            <InputText
                {...props}
                className={`pl-8 ${props.className ?? ""}`}
            />
        </span>
    );
}
