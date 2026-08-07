import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLineNature from "@/interfaces/AccountLineNature";
import AccountLineNatureService from "@/services/AccountLineNatureService";
import { Dropdown, DropdownProps } from "primereact/dropdown";
import { useEffect, useState } from "react";

const natureService = new AccountLineNatureService();

interface AccountLineNatureDropdownProps extends DropdownProps {
    showNullOption?: boolean;
}

export default function AccountLineNatureDropdown(props: AccountLineNatureDropdownProps) {
    const { showNullOption, ...rest } = props;
    const [natures, setNatures] = useState<AccountLineNature[]>([]);

    useEffect(() => {
        natureService.getAllNatures().then(setNatures)
    }, []);

    const allNatures = showNullOption
        ? [{ id: null, label: "- Vide -", color: "" }, ...natures]
        : natures;


    return (
        <Dropdown
            {...rest}
            options={allNatures}
            optionLabel="label"
            optionValue="id"
            placeholder="Sélectionner une nature"
            itemTemplate={(option) => option && <ColoredLabel data={option} />}
            valueTemplate={(option) => option ? <ColoredLabel data={option} /> : <span>Sélectionner</span>}
        />
    )
}