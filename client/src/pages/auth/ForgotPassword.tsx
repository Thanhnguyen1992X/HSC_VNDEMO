import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@shared/schema";
import { Link } from "wouter";
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
import { Mail, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const form = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let json;
      try {
        json = await res.json();
      } catch {
        json = { message: "Server response error" };
      }

      if (!res.ok) {
        throw new Error(json.message || "Failed to send reset email");
      }

      setSent(true);
      toast({
        title: "Email sent",
        description: "If the email exists, a reset link has been sent. Check your inbox and spam folder.",
      });
    } catch (e) {
      const errorMessage = e instanceof Error
        ? e.message
        : (e as any)?.message || "Failed to send reset email. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
        </div>

        <Card className="p-8 border-border/50 shadow-xl rounded-3xl bg-background">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                If an account exists for that email, we&apos;ve sent a reset link. Please check your inbox and spam folder.
              </p>
              <Link href="/admin/login">
                <Button variant="outline" className="w-full">
                  Back to Sign in
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>
          )}
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
