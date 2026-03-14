import { Dialog } from "primereact/dialog";
import UserAvatar from "./atoms/UserAvatar";
import { Button } from "primereact/button";
import { useState } from "react";
import { useConnectedUser } from "../context/ConnectedUserContext";
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
    const [userService] = useState(() => new UserService());
    const { connectedUser, refreshUser } = useConnectedUser();
    const navigate = useNavigate();

    function changeUserAvatar(avatarFileName: string) {
        if (!connectedUser) return;

        userService.changeAvatar(avatarFileName).then(() => refreshUser());
    }

    return (
        <>
            {connectedUser !== null && (
                <Dialog
                    visible={true} onHide={hideDialog}
                    header={`Réglages - ${connectedUser.username}`}
                    className="w-[50vw]"
                >
                    <div>
                        <h4>Avatars utilisateur</h4>
                        <div className="flex gap-2 flex-wrap">

                            {
                                availableAvatars.map(({ fileName, displayName }) => (
                                    <Button
                                        key={"avatar-config-dialog-" + fileName}
                                        outlined={fileName !== connectedUser.avatar}
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
