import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken } from "@/lib/api";
import { fetchWithAuth } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, ShieldOff, Shield, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  isDisabled: boolean;
  employeeCount: number;
  createdAt: string;
};

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "user" | "disabled">("all");
  const [page, setPage] = useState(1);
  const [confirmPromote, setConfirmPromote] = useState<UserRow | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<{ user: UserRow; disable: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  useEffect(() => {
    if (!getAuthToken()) setLocation("/admin/login");
  }, [setLocation]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", page, search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10", search, filter });
      const res = await fetchWithAuth(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/admin/users/${id}/promote`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User promoted to Admin." });
      setConfirmPromote(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, disable }: { id: string; disable: boolean }) =>
      fetchWithAuth(`/api/admin/users/${id}/toggle-status`, {
        method: "PATCH",
        body: JSON.stringify({ disable }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User status updated." });
      setConfirmDisable(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User deleted." });
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const users: UserRow[] = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/50 shrink-0">
            <SidebarTrigger />
            <h1 className="text-xl font-display font-bold">User Management</h1>
          </header>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-4 h-11 rounded-xl"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                      Filter: {filter} <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(["all", "admin", "user", "disabled"] as const).map((f) => (
                      <DropdownMenuItem key={f} onClick={() => { setFilter(f); setPage(1); }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Card className="overflow-hidden border-border/50">
                {isLoading ? (
                  <div className="p-12 text-center text-muted-foreground">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No users found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4 text-left">Username</th>
                          <th className="px-6 py-4 text-left">Email</th>
                          <th className="px-6 py-4 text-left">Role</th>
                          <th className="px-6 py-4 text-left">Status</th>
                          <th className="px-6 py-4 text-left">Employees</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {users.map((u) => (
                          <tr key={u.id} className={u.isDisabled ? "opacity-60" : ""}>
                            <td className="px-6 py-4 font-medium">{u.username}</td>
                            <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                            <td>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                {u.role}
                              </Badge>
                            </td>
                            <td>
                              <Badge variant={u.isDisabled ? "destructive" : "outline"}>
                                {u.isDisabled ? "Disabled" : "Active"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">{u.employeeCount ?? 0}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {u.role === "user" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmPromote(u)}
                                    disabled={u.isDisabled}
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" /> Promote
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={u.isDisabled ? "text-green-600" : "text-destructive"}
                                  onClick={() => setConfirmDisable({ user: u, disable: !u.isDisabled })}
                                >
                                  {u.isDisabled ? (
                                    <><Shield className="w-4 h-4 mr-1" /> Enable</>
                                  ) : (
                                    <><ShieldOff className="w-4 h-4 mr-1" /> Disable</>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={() => setConfirmDelete(u)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {total > 10 && (
                  <div className="flex justify-between items-center px-6 py-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Total: {total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Prev
                      </Button>
                      <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>

      <AlertDialog open={!!confirmPromote} onOpenChange={(o) => !o && setConfirmPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPromote && (
                <>Promote <strong>{confirmPromote.username}</strong> to Admin? They will have full access to all data.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPromote && promoteMutation.mutate(confirmPromote.id)}>
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDisable} onOpenChange={(o) => !o && setConfirmDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDisable?.disable ? "Disable user?" : "Enable user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDisable && (
                <>{confirmDisable.disable ? "Disable" : "Enable"} <strong>{confirmDisable.user.username}</strong>?{confirmDisable.disable ? " They will not be able to login." : ""}</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDisable &&
                toggleMutation.mutate({ id: confirmDisable.user.id, disable: confirmDisable.disable })
              }
            >
              {confirmDisable?.disable ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && (
                <>Delete <strong>{confirmDelete.username}</strong>? This will also delete all {confirmDelete.employeeCount} employees they created. This cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
