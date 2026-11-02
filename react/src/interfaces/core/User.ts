export class User {
    id: number = 0;
    username: string = "";
    avatar: string = "";
    totalXp: number = 0;

    constructor(user: Partial<User>) {
        Object.assign(this, user);
    }
}