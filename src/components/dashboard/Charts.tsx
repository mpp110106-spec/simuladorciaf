import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Turno } from "@/types/turno";

const COLORS = ["#002B7F", "#009FE3", "#CCC399", "#F59E0B", "#10B981", "#EF4444"];

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const Charts = ({ turnos }: { turnos: Turno[] }) => {
  const porTipificacion = useMemo(() => {
    const map = new Map<string, number>();
    turnos.forEach((t) => map.set(t.tipificacion, (map.get(t.tipificacion) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [turnos]);

  const last14 = useMemo(() => {
    const days: { date: string; turnos: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(5, 10), turnos: 0 });
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    turnos.forEach((t) => {
      const d = new Date(t.created_at); d.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 14) {
        const idx = 13 - diff;
        days[idx].turnos += 1;
      }
    });
    return days;
  }, [turnos]);

  const porHora = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hora: `${h}h`, turnos: 0 }));
    turnos.forEach((t) => {
      const h = new Date(t.created_at).getHours();
      buckets[h].turnos += 1;
    });
    return buckets;
  }, [turnos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base text-ciaf-blue">Turnos últimos 14 días</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <LineChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="turnos" stroke="#002B7F" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base text-ciaf-blue">Distribución por tipificación</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={porTipificacion} dataKey="value" nameKey="name" outerRadius={80} label>
                {porTipificacion.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base text-ciaf-blue">Horas pico</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer>
            <BarChart data={porHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="turnos" fill="#009FE3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;