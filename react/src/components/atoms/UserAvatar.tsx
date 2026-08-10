import { Avatar, AvatarProps as PRAvatarProps } from "primereact/avatar";
import { User } from "../../interfaces/User";

const avatarUrlsByFileName = Object.fromEntries(
    Object.entries(
        import.meta.glob("../../assets/images/avatars/*", {
            eager: true,
            import: "default",
        }) as Record<string, string>
    ).map(([filePath, url]) => [filePath.split("/").pop() ?? filePath, url])
);

interface AvatarProps {
    user: User;
    size?: PRAvatarProps["size"];
}

export default function UserAvatar({ user, size = "large" }: AvatarProps) {
    const avatarImage = avatarUrlsByFileName[user.avatar]

    return <Avatar
        image={avatarImage}
        label={user.username}
        shape="circle"
        size={size}
    />;
}

