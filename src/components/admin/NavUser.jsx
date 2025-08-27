import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { UserButton, useUser } from "@clerk/clerk-react"

export default function NavUser() {
    const { isMobile, open } = useSidebar()
    const { user } = useUser();
    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">

                <SidebarMenuButton>
                    <UserButton appearance={{ elements: { avatarBox: "h-4 w-4" } }} />
                    {(isMobile || open) && user && (
                        <div className="flex flex-col leading-tight">
                            <span className="truncate font-semibold text-sm">{user.fullName}</span>
                            <span className="truncate text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
