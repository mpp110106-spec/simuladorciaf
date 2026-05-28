import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, CheckCircle2,
  Loader2, RefreshCw, ShieldAlert, TrendingUp, XCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import ColaLra from "@/components/admin/ColaLra";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

const COLOR_MAIN = "#001550";
const COLOR_MID = "#013084";
const COLOR_ACC = "#0699d9";

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const Kpi = ({ icon: Icon, label, value, sub, accent }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="p-4 border-white/40 bg-white/70 backdrop-blur-md hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
          <div className="text-2xl font-bold text-[#001550] leading-tight tabular-nums">{value}</div>
          {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </Card>
  </motion.div>
);

const PRESETS = [
  { label: "Hoy", from: () => todayISO(), to: () => todayISO() },
  { label: "7 días", from: () => daysAgoISO(6), to: () => todayISO() },
  { label: "30 días", from: () => daysAgoISO(29), to: () => todayISO() },
  { label: "90 días", from: () => daysAgoISO(89), to: () => todayISO() },
];

export default function AdminOperativo() {
  const [from, setFrom] = useState<string>(daysAgoISO(6));
  const [to, setTo] = useState<string>(todayISO());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const d = await adminService.metricasOperativas(from, to);
      setData(d);
    } catch (e) {
      toast.error("Error cargando métricas", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  const sedes = useMemo(() => (data?.saturacion_por_sede as any[]) ?? [], [data]);
  const throughputDia = useMemo(() => ((data?.throughput_por_dia as any[]) ?? []).map((d) => ({
    fecha: d.fecha?.slice(5),
    finalizados: Number(d.finalizados ?? 0),
    auto_cancelados: Number(d.auto_cancelados ?? 0),
    total: Number(d.total ?? 0),
  })), [data]);
  const fallbacksDia = useMemo(() => ((data?.fallbacks_por_dia as any[]) ?? []).map((d) => ({
    fecha: d.fecha?.slice(5),
    fallbacks: Number(d.fallbacks ?? 0),
    sin_asesora: Number(d.sin_asesora ?? 0),
  })), [data]);
  const motivos = useMemo(() => ((data?.fallbacks_por_motivo as any[]) ?? []), [data]);
  const logs = useMemo(() => ((data?.logs_recientes as any[]) ?? []), [data]);

  return (
    <>
      <Helmet><title>Métricas Operativas · CIAF</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#001550]/5 via-slate-50 to-[#0699d9]/5">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Admin</Button></Link>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#001550] to-[#0699d9] flex items-center justify-center text-white shadow-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Métricas operativas</div>
                <div className="text-base font-bold text-[#001550]">Saturación · Fallbacks · Throughput</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <Button key={p.label} variant="outline" size="sm"
                  onClick={() => { setFrom(p.from()); setTo(p.to()); }}>
                  {p.label}
                </Button>
              ))}
              <div className="flex items-center gap-1">
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[140px]" />
                <span className="text-slate-400 text-xs">→</span>
                <Input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} className="h-8 w-[140px]" />
              </div>
              <Button onClick={cargar} size="sm" className="bg-[#013084] hover:bg-[#001550]">
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Aplicar
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {loading && !data ? (
            <div className="h-[60vh] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#013084]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <Kpi icon={CheckCircle2} label="Throughput" value={data?.throughput ?? 0} sub="Finalizados" accent="bg-emerald-600" />
                <Kpi icon={TrendingUp} label="Creados" value={data?.creados ?? 0} accent="bg-[#013084]" />
                <Kpi icon={Zap} label="T. real prom." value={`${data?.tiempo_promedio_real_min ?? 0}m`} accent="bg-[#0699d9]" />
                <Kpi icon={XCircle} label="Auto-cancelados" value={data?.auto_cancelados ?? 0} accent="bg-rose-500" />
                <Kpi icon={ShieldAlert} label="Fallbacks" value={data?.fallbacks ?? 0} accent="bg-amber-500" />
                <Kpi icon={AlertTriangle} label="Sin asesora" value={data?.sin_asesora ?? 0} accent="bg-orange-600" />
                <Kpi icon={Activity} label="Cross-sede" value={data?.cross_branch ?? 0} accent="bg-slate-600" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
                  <h3 className="text-sm font-bold text-[#001550] mb-3">Throughput vs auto-cancelados</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={throughputDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="finalizados" stroke={COLOR_MID} strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="auto_cancelados" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
                  <h3 className="text-sm font-bold text-[#001550] mb-3">Fallbacks por día</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={fallbacksDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="fallbacks" fill={COLOR_ACC} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="sin_asesora" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Saturación por sede */}
              <div>
                <h2 className="text-lg font-bold text-[#001550] mb-3">Saturación por sede</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sedes.map((s: any) => {
                    const pct = s.capacidad_hard > 0
                      ? Math.min(100, Math.round((Number(s.turnos_activos_hoy) / Number(s.capacidad_hard)) * 100))
                      : 0;
                    const tone = pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600";
                    return (
                      <Card key={s.id} className="p-4 bg-white/70 backdrop-blur-md border-white/40">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#0699d9] font-bold">{s.codigo}</p>
                            <h3 className="text-base font-bold text-[#001550]">{s.nombre}</h3>
                          </div>
                          <div className={`text-right ${tone}`}>
                            <p className="text-[10px] uppercase text-slate-500">Ocupación hoy</p>
                            <p className="text-2xl font-bold tabular-nums">{pct}%</p>
                          </div>
                        </div>
                        <Progress value={pct} className="h-2 mb-3" />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-slate-50 p-2">
                            <div className="text-slate-500 uppercase text-[10px]">Activos hoy</div>
                            <div className="font-bold text-[#013084] tabular-nums">{s.turnos_activos_hoy} / {s.capacidad_hard}</div>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2">
                            <div className="text-slate-500 uppercase text-[10px]">Asesoras</div>
                            <div className="font-bold text-[#013084] tabular-nums">{s.asesoras_activas}</div>
                          </div>
                          <div className="rounded-lg bg-emerald-50 p-2">
                            <div className="text-slate-500 uppercase text-[10px]">Finalizados</div>
                            <div className="font-bold text-emerald-700 tabular-nums">{s.finalizados_rango}</div>
                          </div>
                          <div className="rounded-lg bg-rose-50 p-2">
                            <div className="text-slate-500 uppercase text-[10px]">Auto-cancel.</div>
                            <div className="font-bold text-rose-600 tabular-nums">{s.auto_cancelados_rango}</div>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2 col-span-2">
                            <div className="text-slate-500 uppercase text-[10px]">Fallbacks en rango</div>
                            <div className="font-bold text-amber-700 tabular-nums">{s.fallbacks_rango}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Motivos + Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
                  <h3 className="text-sm font-bold text-[#001550] mb-3">Motivos de asignación</h3>
                  {motivos.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin datos en el rango.</p>
                  ) : (
                    <ul className="space-y-2">
                      {motivos.map((m: any) => (
                        <li key={m.motivo} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 truncate">{m.motivo}</span>
                          <span className="font-bold text-[#013084] tabular-nums">{m.total}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-4 lg:col-span-2 bg-white/70 backdrop-blur-md border-white/40">
                  <h3 className="text-sm font-bold text-[#001550] mb-3">Logs recientes de asignación</h3>
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-600">
                        <tr>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-left p-2">Motivo</th>
                          <th className="text-left p-2">Asesora</th>
                          <th className="text-left p-2">Sede</th>
                          <th className="text-center p-2">Carga</th>
                          <th className="text-center p-2">Cap.</th>
                          <th className="text-center p-2">Fallback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((l: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2 tabular-nums text-slate-600">{new Date(l.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</td>
                            <td className="p-2">{l.motivo}</td>
                            <td className="p-2">{l.asesora ?? "—"}</td>
                            <td className="p-2">{l.sede ?? "—"}</td>
                            <td className="p-2 text-center tabular-nums">{l.carga_al_asignar ?? "—"}</td>
                            <td className="p-2 text-center tabular-nums">{l.capacidad ?? "—"}</td>
                            <td className="p-2 text-center">
                              {l.fallback ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">sí</span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">no</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr><td colSpan={7} className="p-6 text-center text-slate-500">Sin registros.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Cola LRA */}
              <ColaLra />
            </>
          )}
        </main>
      </div>
    </>
  );
}