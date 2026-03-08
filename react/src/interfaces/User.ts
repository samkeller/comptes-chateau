export class User {
    id: number = 0;
    username: string = "";

    constructor(user: Partial<User>){
        Object.assign(this, user);
    }
}