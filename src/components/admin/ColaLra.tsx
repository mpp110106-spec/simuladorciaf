import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";
import { Loader2, RefreshCw, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Asesora = Awaited<ReturnType<typeof adminService.colaLra>>["cola"][number];

function timeAgo(iso: string | null): string {
  if (!iso) return "Nunca";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default function ColaLra() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ business_hours: boolean; now_local: string; cola: Asesora[] } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminService.colaLra();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#001550] flex items-center gap-2">
            <Users className="w-4 h-4" /> Cola LRA · Próxima asesora a recibir turno
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Round-Robin por <span className="font-semibold">Least Recently Assigned</span>.
            {data && (
              <> · Hora local: <span className="font-mono">{data.now_local}</span> ·{" "}
                {data.business_hours
                  ? <span className="text-emerald-700 font-semibold">En horario</span>
                  : <span className="text-rose-600 font-semibold">Fuera de horario</span>}
              </>
            )}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {loading && !data ? (
        <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#013084]" /></div>
      ) : !data?.cola.length ? (
        <p className="text-xs text-slate-500">Sin asesoras configuradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Asesora</th>
                <th className="py-2 pr-2">Sede</th>
                <th className="py-2 pr-2">Estado</th>
                <th className="py-2 pr-2">Horario</th>
                <th className="py-2 pr-2">Última asignación</th>
                <th className="py-2 pr-2 text-right">Carga</th>
                <th className="py-2 pr-2 text-right">Atendidos hoy</th>
              </tr>
            </thead>
            <tbody>
              {data.cola.map((a, idx) => (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`border-b last:border-0 ${idx === 0 && a.elegible ? "bg-emerald-50/60" : ""}`}
                >
                  <td className="py-2 pr-2 font-bold text-[#013084] tabular-nums">{a.orden}</td>
                  <td className="py-2 pr-2 font-medium text-[#001550]">{a.nombre}</td>
                  <td className="py-2 pr-2 text-slate-600">{a.sede_codigo ?? "—"}</td>
                  <td className="py-2 pr-2">
                    {a.elegible ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> {a.estado_op}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                        <AlertCircle className="w-3 h-3" /> {a.estado_op}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-xs text-slate-600 font-mono">
                    {a.hora_inicio?.slice(0,5)}–{a.hora_fin?.slice(0,5)}
                  </td>
                  <td className="py-2 pr-2 text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {timeAgo(a.last_assigned_at)}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums font-semibold">
                    {a.carga_actual} / {a.max_capacidad}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-emerald-700 font-semibold">
                    {a.atendidos_hoy}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}