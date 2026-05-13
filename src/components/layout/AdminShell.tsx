import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BarChart3, LayoutDashboard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/turnos", label: "Turnos", icon: ListChecks },
  { to: "/analytics", label: "Analítica", icon: BarChart3 },
];

const AdminShell = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-ciaf-blue transition-colors">
              <ArrowLeft className="w-3 h-3" /> Volver al simulador
            </Link>
            <h1 className="text-2xl font-bold text-ciaf-blue mt-1">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-ciaf-blue-light text-ciaf-blue"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default AdminShell;