import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setAuthToken } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const twoFactorSchema = z.object({
  totpCode: z.string().length(6, "Enter 6-digit code"),
});

type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export default function TwoFactorVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const tempToken = localStorage.getItem("admin_token");

  const form = useForm<TwoFactorInput>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { totpCode: "" },
  });

  const onSubmit = async (data: TwoFactorInput) => {
    if (!tempToken) {
      toast({ title: "Session expired", description: "Please login again.", variant: "destructive" });
      setLocation("/admin/login");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/2fa/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, totpCode: data.totpCode }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Invalid code");
      }
      if (json.accessToken) {
        setAuthToken(json.accessToken);
        toast({ title: "2FA verified", description: "Welcome back." });
        setLocation("/admin");
      }
    } catch (e) {
      toast({ title: "Verification failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  if (!tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No session. <a href="/admin/login">Go to login</a></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="p-8 border-border/50 shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <ShieldCheck className="w-12 h-12 mx-auto text-primary mb-2" />
          <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totpCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
