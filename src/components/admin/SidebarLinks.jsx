import { NavLink } from "react-router-dom";
import { Home, Bed, Book, Users, Image, Salad, BarChart2 } from "lucide-react";

const sidebarLinks = [
    { name: "Dashboard", path: "/admin", icon: <Home size={20} /> },
    { name: "Rooms", path: "/admin/rooms", icon: <Bed size={20} /> },
    { name: "Bookings", path: "/admin/bookings", icon: <Book size={20} /> },
    { name: "Amenities", path: "/admin/amenities", icon: <Salad size={20} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
    { name: "Reports", path: "/admin/reports", icon: <BarChart2 size={20} /> },
    { name: "Images", path: "/admin/images", icon: <Image size={20} /> },
    { name: "Meal Prices", path: "/admin/meal-prices", icon: <Salad size={20} /> },
];

export default function SidebarLinks({ closeSidebar }) {
    return (
        <nav className="flex flex-col gap-2 pt-8">
            {sidebarLinks.map((item, index) => (
                <NavLink
                    to={item.path}
                    key={index}
                    className={({ isActive }) =>
                        `flex items-center px-6 py-3 gap-3 rounded-lg transition text-gray-700
            ${isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"}`

                    }
                    onClick={closeSidebar}
                    end
                >
                    {item.icon}
                    <span>{item.name}</span>
                </NavLink>
            ))}
        </nav>
    );
}
