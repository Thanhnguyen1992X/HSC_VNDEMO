import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@shared/schema";
import { getAuthToken } from "@/lib/api";
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
import { AppSidebar } from "@/components/admin/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, User, Lock, Smartphone } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{ user: { username: string; email: string; isTwoFactorEnabled?: boolean } } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [changePwdPending, setChangePwdPending] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret?: string; qrCodeUrl?: string } | null>(null);
  const [totpVerify, setTotpVerify] = useState("");
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [disable2FAPwd, setDisable2FAPwd] = useState("");
  const [disable2FAPending, setDisable2FAPending] = useState(false);

  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (!getAuthToken()) setLocation("/admin/login");
  }, [setLocation]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) setProfile(json);
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const onChangePassword = async (data: { currentPassword: string; newPassword: string }) => {
    setChangePwdPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      toast({ title: "Password changed", description: "Your password has been updated." });
      passwordForm.reset();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setChangePwdPending(false);
    }
  };

  const onEnable2FA = async () => {
    setTwoFactorPending(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Setup failed");
      setTwoFactorSetup({ secret: json.secret, qrCodeUrl: json.qrCodeUrl });
      toast({ title: "Scan QR code", description: "Enter the 6-digit code to verify." });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTwoFactorPending(false);
    }
  };

  const onVerify2FA = async () => {
    if (!totpVerify || totpVerify.length !== 6) {
      toast({ title: "Enter 6-digit code", variant: "destructive" });
      return;
    }
    setTwoFactorPending(true);
    try {
      const res = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ totpCode: totpVerify }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Verification failed");
      toast({ title: "2FA enabled", description: "Save your backup codes: " + (json.backupCodes?.join(", ") || "see console") });
      setTwoFactorSetup(null);
      setTotpVerify("");
      setProfile((p) => (p ? { ...p, user: { ...p.user, isTwoFactorEnabled: true } } : null));
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setTwoFactorPending(false);
    }
  };

  const onDisable2FA = async () => {
    if (!disable2FAPwd) {
      toast({ title: "Enter password", variant: "destructive" });
      return;
    }
    setDisable2FAPending(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ password: disable2FAPwd }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Disable failed");
      toast({ title: "2FA disabled" });
      setDisable2FAPwd("");
      setProfile((p) => (p ? { ...p, user: { ...p.user, isTwoFactorEnabled: false } } : null));
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDisable2FAPending(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/50 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-display font-bold">Settings</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-2xl space-y-8">
              {/* Profile */}
              <Card className="p-6 border-border/50 shadow-sm">
                <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
                  <User className="w-5 h-5" />
                  Profile
                </h2>
                {loadingProfile ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : profile?.user ? (
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Username:</span> {profile.user.username}</p>
                    <p><span className="text-muted-foreground">Email:</span> {profile.user.email}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Could not load profile.</p>
                )}
              </Card>

              {/* Change Password */}
              <Card className="p-6 border-border/50 shadow-sm">
                <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">Min 8 chars, uppercase, number, special char</p>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={changePwdPending}>
                      {changePwdPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="p-6 border-border/50 shadow-sm">
                <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
                  <Smartphone className="w-5 h-5" />
                  Two-Factor Authentication
                </h2>
                {profile?.user?.isTwoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <span>2FA is enabled</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter password to disable"
                        value={disable2FAPwd}
                        onChange={(e) => setDisable2FAPwd(e.target.value)}
                        className="rounded-xl max-w-xs"
                      />
                      <Button variant="destructive" onClick={onDisable2FA} disabled={disable2FAPending}>
                        {disable2FAPending ? "..." : "Disable 2FA"}
                      </Button>
                    </div>
                  </div>
                ) : twoFactorSetup ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator or Authy.</p>
                    {twoFactorSetup.qrCodeUrl && (
                      <img src={twoFactorSetup.qrCodeUrl} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                    )}
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={totpVerify}
                        onChange={(e) => setTotpVerify(e.target.value.replace(/\D/g, ""))}
                        className="rounded-xl w-32"
                      />
                      <Button onClick={onVerify2FA} disabled={twoFactorPending || totpVerify.length !== 6}>
                        Verify & Enable
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security with 2FA.</p>
                    <Button onClick={onEnable2FA} disabled={twoFactorPending}>
                      {twoFactorPending ? "Setting up..." : "Enable 2FA"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
