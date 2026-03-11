import { useMutation } from "@tanstack/react-query";
import { setAuthToken } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { loginSchema } from "@shared/schema";
import type { z } from "zod";

type LoginInput = z.infer<typeof loginSchema>;

export function useUserLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Login failed");
      }

      const json = await res.json();
      if (json.requiresTwoFactor && json.tempToken) {
        return { requiresTwoFactor: true, tempToken: json.tempToken, user: json.user };
      }
      return {
        token: json.accessToken,
        refreshToken: json.refreshToken,
        user: json.user,
      };
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setAuthToken(data.tempToken);
        toast({ title: "2FA required", description: "Complete verification to continue." });
        setLocation("/admin/2fa"); // Reuse 2FA page, redirects based on role after
        return;
      }
      setAuthToken(data.token);
      toast({ title: "Login successful", description: "Welcome back." });
      if (data.user?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/user/dashboard");
      }
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
