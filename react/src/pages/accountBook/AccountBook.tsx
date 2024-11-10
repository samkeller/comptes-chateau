import { useEffect, useState } from "react"
import AccountLine from "../../interfaces/AccountLine"
import AccountingService from "../../services/AccountingService"

function AccountBook() {

    const [accountLines, setAccountLines] = useState<AccountLine[]>([])

    useEffect(() => {
        new AccountingService().getAllAccountingLines().then(lines => {
            console.log("lines", lines);
        })
    }, [])

    return (
        <div>
            salut
        </div>
    )
}

export default AccountBook