import SidebarLinks from "./SidebarLinks";

export default function Sidebar() {
    return (
        <aside className="hidden md:flex md:w-64 flex-col h-full border-r bg-white shadow">
            <SidebarLinks />
        </aside>
    );
}
