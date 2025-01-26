import { Home, Upload, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const Sidebar = () => {
    const { signOut } = useAuth();

    const menuItems = [
        { href: "/feed", icon: <Home />, label: "Feed" },
        { href: "/profile", icon: <User />, label: "Profile" },
        { href: "/upload", icon: <Upload />, label: "Upload" },
    ];

    return (
        <aside className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-8">
            {menuItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="p-2 hover:bg-gray-800 rounded-full"
                    aria-label={item.label}
                >
                    {item.icon}
                </Link>
            ))}
            <button
                onClick={() => signOut()}
                className="p-2 hover:bg-gray-800 rounded-full mt-auto"
                aria-label="Logout"
            >
                <LogOut />
            </button>
        </aside>
    );
};

export default Sidebar;