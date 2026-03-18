
class Account {
    id: number = 0;
    label: string = "";

    constructor(account: Partial<Account>) {
        Object.assign(this, account);
    }
}

export default Account