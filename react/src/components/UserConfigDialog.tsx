import { Dialog } from "primereact/dialog";
import UserAvatar from "./atoms/UserAvatar";
import { Button } from "primereact/button";
import { User } from "../interfaces/User";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserService from "../services/UserService";

interface UserConfigDialogProps {
    hideDialog: () => void;
}

/**
 * Charge les paths complets ("/src/assets/images/avatars/003-boy.png")
 */
const availableAvatarsUrls = import.meta.glob("@assets/images/avatars/*", {
    eager: true,
    import: "default",
}) as Record<string, string>;

const availableAvatars = Object.keys(availableAvatarsUrls).map((filePath) => {
    const fileName = filePath.split("/").pop() || filePath;

    return {
        fileName,
        displayName: fileName.split(".")[0],
    };
});

export default function UserConfigDialog({ hideDialog }: UserConfigDialogProps) {
    const userService = new UserService()
    const [user, setUser] = useState<User | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        userService.me().then(setUser)
    }, [])

    function changeUserAvatar(avatarFileName: string) {
        if (!user) return;

        userService.changeAvatar(avatarFileName).then((updatedUser) =>
            setUser(updatedUser)
        )

    }

    return (
        <>
            {user !== null && (
                <Dialog
                    visible={true} onHide={hideDialog}
                    header={`Réglages - ${user.username}`}
                    className="w-[50vw]"
                >
                    <div>
                        <h4>Avatars utilisateur</h4>
                        <div className="flex gap-2 flex-wrap">

                            {
                                availableAvatars.map(({ fileName, displayName }) => (
                                    <Button
                                        key={"avatar-config-dialog-" + fileName}
                                        outlined={fileName !== user.avatar}
                                        className="w-[48px] h-[48px] p-0 flex justify-center items-center"
                                        onClick={() => changeUserAvatar(fileName)}
                                    >
                                        <UserAvatar
                                            key={fileName}
                                            user={{
                                                id: 0,
                                                avatar: fileName,
                                                username: displayName
                                            }}
                                        />

                                    </Button>
                                ))
                            }
                            <Button
                                link
                                label="Ressource"
                                onClick={() => window.open("https://www.flaticon.com/free-icons/avatar", "_blank")}
                                className="text-xs"
                            />
                        </div>

                        <Button
                            link
                            label="Si la selection proposée ne vous convient pas. Merci de le signaler via la page kanban."
                            onClick={() => navigate("/kanban")}
                            className="text-xs"
                        />

                    </div>


                </Dialog>
            )}
        </>
    );
}
