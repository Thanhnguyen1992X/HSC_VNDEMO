import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { api, buildUrl } from "@shared/routes";
import type { InsertEmployee } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useUserStats() {
  return useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/user/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useUserEmployees() {
  return useQuery({
    queryKey: ["/api/user/employees"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/user/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });
}

export function useCreateUserEmployee() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const res = await fetchWithAuth("/api/user/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/employees"] });
      qc.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({ title: "Success", description: "Employee created." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateUserEmployee() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...data }: InsertEmployee & { id: string }) => {
      const res = await fetchWithAuth(`/api/user/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["/api/user/employees"] });
      qc.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({ title: "Success", description: "Employee updated." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteUserEmployee() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/user/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/employees"] });
      qc.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({ title: "Deleted", description: "Employee removed." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useToggleUserEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetchWithAuth(`/api/user/employees/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to change status");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user/employees"] });
      qc.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
  });
}
