import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminShell from "@/components/layout/AdminShell";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTurnos } from "@/hooks/useTurnos";
import { usePageView } from "@/hooks/useTracking";

const COLORS = ["#002B7F", "#009FE3", "#CCC399", "#10B981", "#F59E0B"];

const Analytics = () => {
  usePageView("analytics_visitado");
  const { events } = useAnalytics();
  const { turnos } = useTurnos();

  const visitas = events.filter((e) => e.evento === "visita_app").length;
  const simulaciones = events.filter((e) => e.evento === "simulacion_realizada").length;
  const turnosCount = turnos.length;

  const dispositivos = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.dispositivo ?? "Otro", (m.get(e.dispositivo ?? "Otro") ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [events]);

  const navegadores = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.navegador ?? "Otro", (m.get(e.navegador ?? "Otro") ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [events]);

  const funnel = [
    { name: "Visitas", value: visitas },
    { name: "Simulaciones", value: simulaciones },
    { name: "Turnos", value: turnosCount },
  ];

  return (
    <>
      <Helmet>
        <title>Analítica | Atención CIAF</title>
      </Helmet>
      <AdminShell title="Analítica" subtitle="Conversión, dispositivos y comportamiento">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base text-ciaf-blue">Funnel de conversión</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <BarChart data={funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#002B7F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base text-ciaf-blue">Dispositivos</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dispositivos} dataKey="value" nameKey="name" outerRadius={90} label>
                    {dispositivos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base text-ciaf-blue">Navegadores</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <BarChart data={navegadores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#009FE3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </>
  );
};

export default Analytics;