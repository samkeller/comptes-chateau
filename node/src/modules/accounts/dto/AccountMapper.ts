import { Account } from "../entities/Account";
import type { AccountDto } from "@chocosous/shared";

export default function toAccountDto(account: Account): AccountDto {
    return {
        id: account.id,
        label: account.label
    };
}