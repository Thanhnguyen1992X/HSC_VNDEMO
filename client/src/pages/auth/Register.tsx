import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@shared/schema";
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
import { UserPlus } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<{ username: string; email: string; password: string }>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = async (data: { username: string; email: string; password: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Registration failed");
      }
      toast({
        title: "Registration successful",
        description: "Please verify your email. You can now sign in.",
      });
      setLocation("/admin/login");
    } catch (e) {
      toast({
        title: "Registration failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Register to access the Admin Portal</p>
        </div>

        <Card className="p-8 border-border/50 shadow-xl rounded-3xl bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe"
                        className="h-12 px-4 rounded-xl"
                        minLength={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="h-12 px-4 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl">
                Create Account
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/admin/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
