import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { useUserLogin } from "@/hooks/use-user-login";
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
import { Link } from "wouter";
import { User } from "lucide-react";
import type { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function UserLogin() {
  const loginMutation = useUserLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your digital business cards</p>
        </div>

        <Card className="p-8 border-border/50 shadow-xl shadow-black/5 rounded-3xl bg-background">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter username or email"
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
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl mt-2 bg-primary hover:bg-primary/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
              <a
                href="/api/auth/google"
                className="block w-full mt-3 text-center text-sm text-muted-foreground hover:underline"
              >
                Sign in with Google
              </a>
              <div className="flex justify-between mt-4 text-sm">
                <Link href="/auth/forgot-password" className="text-muted-foreground hover:underline">
                  Forgot password?
                </Link>
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Create account
                </Link>
              </div>
            </form>
          </Form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Admin? <Link href="/admin/login" className="text-primary hover:underline">Sign in to Admin Portal</Link>
        </p>
      </div>
    </div>
  );
}
