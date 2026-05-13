import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, ListChecks, TrendingUp, Users, Timer } from "lucide-react";
import type { Turno } from "@/types/turno";
import type { AnalyticsEvent } from "@/types/analytics";

interface Props {
  turnos: Turno[];
  events?: AnalyticsEvent[];
}

const KpiCards = ({ turnos, events = [] }: Props) => {
  const kpis = useMemo(() => {
    const total = turnos.length;
    const pendientes = turnos.filter((t) => t.estado === "pendiente").length;
    const enProceso = turnos.filter((t) => t.estado === "en_proceso").length;
    const finalizados = turnos.filter((t) => t.estado === "finalizado").length;
    const visitas = events.filter((e) => e.evento === "visita_app").length;
    const conv = visitas > 0 ? Math.round((total / visitas) * 100) : 0;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const turnosHoy = turnos.filter((t) => new Date(t.created_at) >= today).length;

    return [
      { label: "Total turnos", value: total, icon: ListChecks, accent: "text-ciaf-blue" },
      { label: "Pendientes", value: pendientes, icon: Clock, accent: "text-amber-600" },
      { label: "En proceso", value: enProceso, icon: Timer, accent: "text-ciaf-blue" },
      { label: "Finalizados", value: finalizados, icon: CheckCircle2, accent: "text-emerald-600" },
      { label: "Turnos hoy", value: turnosHoy, icon: Users, accent: "text-ciaf-blue" },
      { label: "Conversión", value: `${conv}%`, icon: TrendingUp, accent: "text-emerald-600" },
    ];
  }, [turnos, events]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${accent}`} />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;