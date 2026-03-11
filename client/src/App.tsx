import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import NameCard from "@/pages/public/NameCard";
import Login from "@/pages/admin/Login";
import UserLogin from "@/pages/user/UserLogin";
import TwoFactorVerify from "@/pages/admin/TwoFactorVerify";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import Dashboard from "@/pages/admin/Dashboard";
import Employees from "@/pages/admin/Employees";
import AdminUsers from "@/pages/admin/AdminUsers";
import UserDashboard from "@/pages/user/UserDashboard";
import UserEmployees from "@/pages/user/UserEmployees";
import UserSettings from "@/pages/user/UserSettings";
import Settings from "@/pages/admin/Settings";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/admin/login" component={Login} />
      <Route path="/user/login" component={UserLogin} />
      <Route path="/admin/2fa" component={TwoFactorVerify} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/auth/verify-email" component={VerifyEmail} />
      {/* Admin Routes */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/employees" component={Employees} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/settings" component={Settings} />
      {/* User Routes */}
      <Route path="/user" component={UserDashboard} />
      <Route path="/user/dashboard" component={UserDashboard} />
      <Route path="/user/employees" component={UserEmployees} />
      <Route path="/user/settings" component={UserSettings} />
      
      {/* Public Name Card Route - Must be last to not catch /admin */}
      {/* allow optional language segment so /000022/en still renders the card */}
      <Route path="/:id/:lang?" component={NameCard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
