import { Link, useLocation } from "wouter";
import { 
  Users, 
  UserCog,
  LayoutDashboard, 
  LogOut,
  Settings
} from "lucide-react";
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

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    clearAuthToken();
    setLocation("/admin/login");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 mb-2">
            <h2 className="text-xl font-display font-bold text-sidebar-primary">HSC Admin</h2>
            <p className="text-sm text-sidebar-foreground/60">Digital Business Cards</p>
          </div>
          
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/admin"}>
                  <Link href="/admin" className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/admin/employees"}>
                  <Link href="/admin/employees" className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span>Employees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/admin/users"}>
                  <Link href="/admin/users" className="flex items-center gap-3">
                    <UserCog className="w-5 h-5" />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/admin/settings"}>
                  <Link href="/admin/settings" className="flex items-center gap-3">
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
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
