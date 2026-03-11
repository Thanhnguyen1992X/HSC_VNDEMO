import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchWithAuth } from "@/lib/api";
import type { InsertEmployee, UpdateEmployeeRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === PUBLIC HOOKS ===

export function usePublicEmployee(id: string) {
  return useQuery({
    queryKey: [api.public.getEmployee.path, id],
    queryFn: async () => {
      const url = buildUrl(api.public.getEmployee.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch card");
      return api.public.getEmployee.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

// === ADMIN HOOKS ===

export function useAdminEmployees() {
  return useQuery({
    queryKey: [api.employees.list.path],
    queryFn: async () => {
      const res = await fetchWithAuth(api.employees.list.path);
      if (!res.ok) throw new Error("Failed to fetch employees");
      return api.employees.list.responses[200].parse(await res.json());
    },
  });
}

export function useAdminEmployee(id: string) {
  return useQuery({
    queryKey: [api.employees.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.employees.get.path, { id });
      const res = await fetchWithAuth(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch employee");
      return api.employees.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const validated = api.employees.create.input.parse(data);
      const res = await fetchWithAuth(api.employees.create.path, {
        method: api.employees.create.method,
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message || "Validation failed");
        }
        throw new Error("Failed to create employee");
      }
      return api.employees.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      toast({ title: "Success", description: "Employee created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateEmployeeRequest & { id: string }) => {
      const validated = api.employees.update.input.parse(data);
      const url = buildUrl(api.employees.update.path, { id });
      const res = await fetchWithAuth(url, {
        method: api.employees.update.method,
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) throw new Error("Failed to update employee");
      return api.employees.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.employees.get.path, variables.id] });
      toast({ title: "Success", description: "Employee updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.employees.delete.path, { id });
      const res = await fetchWithAuth(url, { method: api.employees.delete.method });
      if (res.ok) {
        return;
      }

      // try to parse a JSON body from the server so we can show a helpful message
      let message = `Failed to delete employee (${res.status})`;
      try {
        const json = await res.json();
        if (json && typeof json.message === 'string') {
          message = json.message;
        }
      } catch {
        // ignore parse errors, keep generic message
      }
      throw new Error(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      toast({ title: "Deleted", description: "Employee has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useToggleEmployeeStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const url = buildUrl(api.employees.toggleActive.path, { id });
      const res = await fetchWithAuth(url, {
        method: api.employees.toggleActive.method,
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to change status");
      return api.employees.toggleActive.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.employees.get.path, variables.id] });
    }
  });
}
