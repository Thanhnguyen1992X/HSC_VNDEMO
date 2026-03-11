import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { clearAuthToken } from "@/lib/api";

export function UserSidebar() {
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    clearAuthToken();
    window.location.href = "/user/login";
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 mb-2">
            <h2 className="text-xl font-display font-bold text-sidebar-primary">User Portal</h2>
            <p className="text-sm text-sidebar-foreground/60">My Business Cards</p>
          </div>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/user" || location === "/user/dashboard"}>
                  <Link href="/user/dashboard" className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/user/employees"}>
                  <Link href="/user/employees" className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span>My Employees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/user/settings"}>
                  <Link href="/user/settings" className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
