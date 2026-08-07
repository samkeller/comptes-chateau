import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel";
import AccountLinePoste from "@/interfaces/AccountLinePoste";
import AccountLinePosteService from "@/services/AccountLinePosteService";
import { Dropdown, DropdownProps } from "primereact/dropdown";
import { useEffect, useState } from "react";

const posteService = new AccountLinePosteService();

interface AccountLinePosteDropdownProps extends DropdownProps {
    accountId: number;
    showNullOption?: boolean;
}

export default function AccountLinePosteDropdown(props: AccountLinePosteDropdownProps) {
    const { accountId, showNullOption, ...rest } = props;
    const [postes, setPostes] = useState<AccountLinePoste[]>([]);

    useEffect(() => {
        posteService.getAllAccountPostes(accountId).then(setPostes)
    }, [accountId]);

    const allPostes = showNullOption
        ? [{ id: null, label: "- Vide -", color: "" }, ...postes]
        : postes;


    return (
        <Dropdown
            {...rest}
            options={allPostes}
            optionLabel="label"
            optionValue="id"
            placeholder="Sélectionner un poste"
            itemTemplate={(option) => option && <ColoredLabel data={option} />}
            valueTemplate={(option) => option ? <ColoredLabel data={option} /> : <span>Sélectionner</span>}
        />
    )
}