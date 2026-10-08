import { InputText, InputTextProps } from 'primereact/inputtext';
import { InputIcon } from 'primereact/inputicon'
import { IconField } from 'primereact/iconfield';

/**
 * Pour le moment, primereact ne fournit pas de composant de recherche intégré, donc nous créons un composant personnalisé pour ajouter une icone de recherche.
 * @param props 
 * @returns 
 */
export default function InputSearch(props: InputTextProps) {
    return (
        <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
                {...props}
            />
        </IconField>
    );
}
