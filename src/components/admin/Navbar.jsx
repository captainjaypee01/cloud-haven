import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import SidebarLinks from "./SidebarLinks"; // We'll extract the nav links as a component
import { Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { assets } from "../../assets/assets";

export default function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-200 py-3 bg-white shadow-sm relative z-10">
            <div className="flex items-center gap-2">
                {/* Hamburger - only on mobile */}
                <div className="md:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <button
                                className="p-1 rounded focus:outline-none"
                                aria-label="Open menu"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-7 w-7 text-gray-700" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SidebarLinks closeSidebar={() => setSidebarOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
                <Link to="/">
                    <img src={assets.testLogo} alt="logo" className='h-9' />
                </Link>
            </div>
            <UserButton />
        </header>
    );
}
