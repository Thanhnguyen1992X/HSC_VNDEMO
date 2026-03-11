import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@shared/schema";
import { Link, useLocation } from "wouter";
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
import { Lock } from "lucide-react";
import { z } from "zod";

const resetFormSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const token = params.get("token");

  const form = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: { password: string }) => {
    if (!token) {
      toast({ title: "Invalid link", description: "Missing reset token", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Reset failed");
      }
      toast({
        title: "Password reset",
        description: "Your password has been updated. Please sign in.",
      });
      setLocation("/admin/login");
    } catch (e) {
      toast({
        title: "Reset failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <p className="text-center text-muted-foreground mb-4">
            Invalid or missing reset token. Please request a new reset link.
          </p>
          <Link href="/auth/forgot-password">
            <Button className="w-full">Request Reset Link</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2">Enter your new password</p>
        </div>

        <Card className="p-8 border-border/50 shadow-xl rounded-3xl bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 px-4 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Min 8 chars, uppercase, number, special char
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 px-4 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl">
                Reset Password
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/admin/login" className="text-primary hover:underline font-medium">
              Back to Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
