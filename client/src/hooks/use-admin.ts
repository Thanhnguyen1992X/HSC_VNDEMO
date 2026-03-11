import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AdminLoginInput } from "@shared/routes";
import { setAuthToken } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AdminLoginInput) => {
      const validated = api.admin.login.input.parse(data);
      const res = await fetch(api.admin.login.path, {
        method: api.admin.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error(json.message || "Invalid username or password");
        }
        if (res.status === 403) {
          throw new Error(json.message || "Access denied");
        }
        throw new Error(json.message || "Failed to login");
      }

      const json = await res.json();
      if (json.requiresTwoFactor && json.tempToken) {
        return { requiresTwoFactor: true, tempToken: json.tempToken };
      }
      return {
        token: json.token || json.accessToken,
        refreshToken: json.refreshToken,
        user: json.user,
      };
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setAuthToken(data.tempToken);
        setLocation("/admin/2fa");
        return;
      }
      setAuthToken(data.token);
      toast({ title: "Login successful", description: "Welcome back." });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
