import { useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken } from "@/lib/api";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
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
  Cell
} from "recharts";
import { Eye, TrendingUp, Users, Smartphone, QrCode, Monitor } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = useAnalyticsSummary();

  useEffect(() => {
    if (!getAuthToken()) setLocation("/admin/login");
  }, [setLocation]);

  const COLORS = ['hsl(211, 56%, 23%)', 'hsl(44, 84%, 60%)', 'hsl(200, 40%, 40%)', 'hsl(150, 40%, 50%)'];

  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'qr': return <QrCode className="w-4 h-4" />;
      case 'nfc': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
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
              <h1 className="text-xl font-display font-bold">Dashboard</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-[50vh]">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : summary ? (
              <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Eye className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Card Views</p>
                      <h3 className="text-3xl font-display font-bold mt-1">{summary.totalViews.toLocaleString()}</h3>
                    </div>
                  </Card>
                  
                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Profiles</p>
                      <h3 className="text-3xl font-display font-bold mt-1">{summary.totalProfiles.toLocaleString()}</h3>
                    </div>
                  </Card>

                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Active Profiles</p>
                      <h3 className="text-3xl font-display font-bold mt-1">{summary.totalActiveProfiles.toLocaleString()}</h3>
                    </div>
                  </Card>

                  <Card className="p-6 border-border/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Top Source</p>
                      <h3 className="text-2xl font-display font-bold mt-1 capitalize">
                        {summary.viewsBySource.sort((a,b)=>b.count-a.count)[0]?.source || "N/A"}
                      </h3>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Views Chart */}
                  <Card className="p-6 border-border/50 shadow-sm lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-display font-bold mb-6">Views Last 7 Days</h3>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary.recentViews}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(val) => format(parseISO(val), 'MMM dd')}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => format(parseISO(val as string), 'MMMM dd, yyyy')}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Sources Pie */}
                  <Card className="p-6 border-border/50 shadow-sm flex flex-col">
                    <h3 className="text-lg font-display font-bold mb-6">Traffic Sources</h3>
                    <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.viewsBySource}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="source"
                          >
                            {summary.viewsBySource.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number, name: string) => [value, name.toUpperCase()]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-display font-bold text-foreground">{summary.totalViews}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      {summary.viewsBySource.map((entry, index) => (
                        <div key={entry.source} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-xs font-medium uppercase text-muted-foreground">{entry.source}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Top Performers Table */}
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="p-6 border-b border-border/50">
                    <h3 className="text-lg font-display font-bold">Top Performing Cards</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Rank</th>
                          <th className="px-6 py-4">Employee</th>
                          <th className="px-6 py-4 text-right">Total Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {summary.topEmployees.map((emp, index) => (
                          <tr key={emp.employeeId} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 font-bold text-muted-foreground">#{index + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-foreground">{emp.fullName}</div>
                              <div className="text-xs text-muted-foreground">ID: {emp.employeeId}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-display font-bold text-primary">
                              {emp.viewCount.toLocaleString()}
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
