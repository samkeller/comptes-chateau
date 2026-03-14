import { Avatar } from "primereact/avatar";
import { User } from "../../interfaces/User";
const avatarUrlsByFileName = Object.fromEntries(
    Object.entries(
        import.meta.glob("@assets/images/avatars/*", {
            eager: true,
            import: "default",
        }) as Record<string, string>
    ).map(([filePath, url]) => [filePath.split("/").pop() ?? filePath, url])
);

interface AvatarProps {
    user: User
}

export default function UserAvatar({ user }: AvatarProps) {
    const avatarImage = avatarUrlsByFileName[user.avatar]

    return <Avatar
        image={avatarImage}
        label={user.username}
        shape="circle"
        size="large"
    />;
}

