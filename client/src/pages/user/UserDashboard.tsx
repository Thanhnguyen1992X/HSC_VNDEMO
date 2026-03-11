import { useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken } from "@/lib/api";
import { useUserStats } from "@/hooks/use-user";
import { UserSidebar } from "@/components/user/UserSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Eye, Users, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = useUserStats();

  useEffect(() => {
    if (!getAuthToken()) setLocation("/user/login");
  }, [setLocation]);

  const COLORS = ["hsl(211, 56%, 23%)", "hsl(44, 84%, 60%)", "hsl(200, 40%, 40%)", "hsl(150, 40%, 50%)"];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/20">
        <UserSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-background border-b border-border/50 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-display font-bold">Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
            {isLoading ? (
              <div className="flex justify-center h-[50vh]">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : summary ? (
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Eye className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">My Card Views</p>
                      <h3 className="text-3xl font-display font-bold mt-1">
                        {(summary.totalViews ?? 0).toLocaleString()}
                      </h3>
                    </div>
                  </Card>
                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">My Profiles</p>
                      <h3 className="text-3xl font-display font-bold mt-1">
                        {(summary.totalProfiles ?? 0).toLocaleString()}
                      </h3>
                    </div>
                  </Card>
                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Profiles</p>
                      <h3 className="text-3xl font-display font-bold mt-1">
                        {(summary.totalActiveProfiles ?? 0).toLocaleString()}
                      </h3>
                    </div>
                  </Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="p-6 border-border/50 shadow-sm lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-display font-bold mb-6">Views Last 7 Days</h3>
                    <div className="min-h-[250px]">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={summary.recentViews ?? []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => (val ? format(parseISO(val), "MMM dd") : "")}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="p-6 border-border/50 shadow-sm">
                    <h3 className="text-lg font-display font-bold mb-6">Traffic Sources</h3>
                    <div className="min-h-[200px]">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={summary.viewsBySource ?? []}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="source"
                          >
                            {(summary.viewsBySource ?? []).map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [v, (n as string).toUpperCase()]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="p-6 border-b border-border/50">
                    <h3 className="text-lg font-display font-bold">Top Performing Cards</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4 text-left">Employee</th>
                          <th className="px-6 py-4 text-right">Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(summary.topEmployees ?? []).map((emp: any) => (
                          <tr key={emp.employeeId} className="hover:bg-muted/20">
                            <td className="px-6 py-4 font-semibold">{emp.fullName}</td>
                            <td className="px-6 py-4 text-right font-display font-bold text-primary">
                              {emp.viewCount?.toLocaleString() ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
