import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken } from "@/lib/api";
import { 
  useAdminEmployees, 
  useDeleteEmployee, 
  useToggleEmployeeStatus,
  useCreateEmployee,
  useUpdateEmployee
} from "@/hooks/use-employees";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import type { Employee, InsertEmployee } from "@shared/schema";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Employees() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) setLocation("/admin/login");
  }, [setLocation]);

  const { data: employees = [], isLoading } = useAdminEmployees();
  const deleteMutation = useDeleteEmployee();
  const toggleMutation = useToggleEmployeeStatus();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.position_en || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department_en || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: InsertEmployee) => {
    if (editingEmployee) {
      await updateMutation.mutateAsync({ ...data, id: editingEmployee.id });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/50 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-display font-bold">Employee Directory</h1>
            </div>
            <Button onClick={handleOpenCreate} className="rounded-xl shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
            <Card className="border-border/50 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-background shrink-0">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search by name, ID or department..." 
                    className="pl-9 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Showing {filteredEmployees.length} profiles
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 w-[250px]">Employee</th>
                      <th className="px-6 py-4">Role & Dept</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-background">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="h-32 text-center text-muted-foreground">Loading directory...</td>
                      </tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No employees found</p>
                            <p className="text-sm">Try adjusting your search or add a new employee.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 border border-primary/20">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl}
                                    alt={emp.fullName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // fallback to initials if image fails to load
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=1a3a5c&color=fff&size=256`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                    {emp.fullName.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{emp.fullName}</div>
                                <div className="text-xs font-medium text-primary mt-0.5">{emp.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{emp.position}{emp.position_en ? ` / ${emp.position_en}` : ''}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {emp.department}{emp.department_en ? ` / ${emp.department_en}` : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="truncate max-w-[200px]">{emp.email}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{emp.phone}</div>
                            {emp.fax && (
                              <div className="text-xs text-muted-foreground mt-0.5">Fax: {emp.fax}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={emp.isActive ? "default" : "secondary"} className={emp.isActive ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-0" : ""}>
                              {emp.isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                              {emp.isActive ? "Active" : "Hidden"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.open(`/${emp.id}`, '_blank')} className="cursor-pointer">
                                  <ExternalLink className="mr-2 h-4 w-4" /> View Public Card
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(emp)} className="cursor-pointer">
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleMutation.mutate({ id: emp.id, isActive: !emp.isActive })}
                                  className="cursor-pointer"
                                >
                                  {emp.isActive ? <XCircle className="mr-2 h-4 w-4 text-orange-500" /> : <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                                  {emp.isActive ? "Deactivate Link" : "Activate Link"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeletingId(emp.id)} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <div className="bg-background rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-2xl font-display">
                {editingEmployee ? "Edit Employee Profile" : "Create New Employee"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-0 bg-muted/10">
              <EmployeeForm 
                initialData={editingEmployee} 
                onSubmit={handleFormSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee record and their digital business card will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  );
}
