import { useConnectedUser } from "@/context/ConnectedUserContext";
import { useEffect, useMemo, useState } from "react";
import UserService from "@/services/UserService";
import { User } from "@/interfaces/core/User";
import XpPodiumPlayer from "./XpPodiumPlayer";
import { Card } from "primereact/card";

export default function XpPodium() {
    const { connectedUser } = useConnectedUser();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const service = new UserService();

        service.getAllUsers()
            .then((allUsers) => setUsers(allUsers))
            .catch(() => setUsers([]));
    }, []);

    useEffect(() => {
        if (!connectedUser) {
            return;
        }

        setUsers((previousUsers) => {
            const hasConnectedUser = previousUsers.some((user) => user.id === connectedUser.id);

            if (!hasConnectedUser) {
                return [...previousUsers, connectedUser];
            }

            return previousUsers.map((user) => (user.id === connectedUser.id ? connectedUser : user));
        });
    }, [connectedUser]);

    const rankedUsers = useMemo(() => {
        return [...users].sort((a, b) => b.totalXp - a.totalXp);
    }, [users]);

    const topThree = rankedUsers.slice(0, 3);

    const isConnectedUser = (userId: number) => userId === connectedUser?.id;

    return (
        <Card title="Podium XP">
            <div className={`flex flex-col gap-6`}>
                {/* Podium à 3 marches */}
                <div className="flex items-end justify-center gap-4 md:gap-8">
                    {/* 2ème place (gauche) */}
                    {topThree[1] && (
                        <XpPodiumPlayer
                            user={topThree[1]}
                            rank={1}
                            isConnectedUser={isConnectedUser(topThree[1].id)}
                        />
                    )}

                    {/* 1ère place (centre) */}
                    {topThree[0] && (
                        <XpPodiumPlayer
                            user={topThree[0]}
                            rank={0}
                            isConnectedUser={isConnectedUser(topThree[0].id)}
                        />
                    )}

                    {/* 3ème place (droite) */}
                    {topThree[2] && (
                        <XpPodiumPlayer
                            user={topThree[2]}
                            rank={2}
                            isConnectedUser={isConnectedUser(topThree[2].id)}
                        />
                    )}
                </div>
            </div>
        </Card>
    );
}
