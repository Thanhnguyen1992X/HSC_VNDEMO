import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`/api/auth/verify-email/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStatus("success");
          toast({ title: "Email verified", description: "You can now sign in." });
          setTimeout(() => setLocation("/admin/login"), 3000);
        } else {
          setStatus("error");
          toast({ title: "Verification failed", description: json.message || "Invalid or expired link", variant: "destructive" });
        }
      })
      .catch(() => {
        setStatus("error");
        toast({ title: "Verification failed", description: "Something went wrong", variant: "destructive" });
      });
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold mb-2">Email Verified</h1>
            <p className="text-muted-foreground mb-6">You can now sign in to your account.</p>
            <Link href="/admin/login">
              <Button>Sign In</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">Invalid or expired link. You can request a new verification email.</p>
            <Link href="/admin/login">
              <Button variant="outline">Back to Sign In</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
