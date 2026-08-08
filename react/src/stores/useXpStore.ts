import { create } from "zustand";
import { User } from "@/interfaces/User";

interface UserXp extends User {
    previousXp: number
}

interface XpStore {
    users: UserXp[];
    initialize(users: User[]): void
    updateUserXp(user: User): void;
}

export const useXpStore = create<XpStore>((set) => ({
    users: [],

    initialize: (users: User[]) =>
        set({
            users: users.map(u => {
                return {
                    ...u,
                    previousXp: u.totalXp,
                }
            })
        }),
    updateUserXp: (user: User) => {
        set((state) => ({
            users: state.users.map(xpUser =>
                xpUser.id === user.id
                    ? {
                        ...user,
                        previousXp: xpUser.totalXp,
                    }
                    : xpUser
            )
        }));
    }
}))