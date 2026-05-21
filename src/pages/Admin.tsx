import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Building2, Star, LogOut, Loader2, TrendingUp,
  Hourglass, Zap, CheckCircle2, Clock, FileSignature, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLOR_MAIN = "#001550";
const COLOR_MID = "#013084";
const COLOR_ACC = "#0699d9";

const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-500", ocupada: "bg-[#0699d9]", en_llamada: "bg-amber-500",
  en_pausa: "bg-orange-500", almuerzo: "bg-purple-500",
  offline: "bg-slate-400", jornada_finalizada: "bg-slate-300",
};
const ESTADO_LABEL: Record<string, string> = {
  disponible: "Disponible", ocupada: "Ocupada", en_llamada: "En llamada",
  en_pausa: "En pausa", almuerzo: "Almuerzo",
  offline: "Offline", jornada_finalizada: "Finalizó",
};

const Kpi = ({ icon: Icon, label, value, sub, accent }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="p-4 border-white/40 bg-white/70 backdrop-blur-md hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold truncate">{label}</div>
          <div className="text-2xl font-bold text-[#001550] leading-tight tabular-nums">{value}</div>
          {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function Admin() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [asesoras, setAsesoras] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [satis, setSatis] = useState<any>(null);

  const cargar = async () => {
    try {
      const [k, a, s, sa] = await Promise.all([
        adminService.kpis(), adminService.asesoras(), adminService.sedes(), adminService.satisfaccion(),
      ]);
      setKpis(k); setAsesoras(a as any[]); setSedes(s as any[]); setSatis(sa);
    } catch (e) {
      toast.error("Error cargando datos", { description: e instanceof Error ? e.message : "" });
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const ch = supabase.channel("admin-realtime")
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "turnos" }, cargar)
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "asesores" }, cargar)
      .on("postgres_changes" as never, { event: "*", schema: "public", table: "encuestas_satisfaccion" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <Loader2 className="w-8 h-8 animate-spin text-[#013084]" />
    </div>;
  }

  const ranking = [...asesoras]
    .filter((a) => a.satisfaccion !== null && a.satisfaccion !== undefined)
    .sort((a, b) => Number(b.satisfaccion ?? 0) - Number(a.satisfaccion ?? 0))
    .slice(0, 3);

  const sedesChart = sedes.map((s: any) => ({ sede: s.codigo, atenciones: s.finalizados, espera: s.en_espera }));
  const estadoChart = (kpis?.por_estado as any[] ?? []).map((e: any) => ({ name: e.estado, value: e.total }));
  const horaChart = (kpis?.por_hora as any[] ?? []).map((h: any) => ({ hora: `${h.hora}:00`, total: h.total }));
  const tendChart = (kpis?.tendencia_7d as any[] ?? []).map((t: any) => ({ fecha: t.fecha?.slice(5), total: t.total }));

  return (
    <>
      <Helmet><title>Centro de Control · CIAF</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#001550]/5 via-slate-50 to-[#0699d9]/5">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#001550] to-[#0699d9] flex items-center justify-center text-white shadow-lg">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Centro de control ejecutivo</div>
                <div className="text-base font-bold text-[#001550]">CIAF · Dirección de Riesgos</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500">
              <LogOut className="w-4 h-4 mr-1" /> Salir
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
            <Kpi icon={Users} label="Estudiantes hoy" value={kpis?.estudiantes_hoy ?? 0} accent="bg-[#001550]" />
            <Kpi icon={Hourglass} label="En espera" value={kpis?.turnos_esperando ?? 0} accent="bg-amber-500" />
            <Kpi icon={Zap} label="En atención" value={kpis?.atenciones_activas ?? 0} accent="bg-[#0699d9]" />
            <Kpi icon={CheckCircle2} label="Finalizados" value={kpis?.finalizados_hoy ?? 0} accent="bg-emerald-600" />
            <Kpi icon={FileSignature} label="Financiaciones" value={kpis?.financiaciones_hoy ?? 0} accent="bg-[#013084]" />
            <Kpi icon={Clock} label="T. promedio" value={`${kpis?.tiempo_promedio_global ?? 0}m`} accent="bg-slate-600" />
            <Kpi icon={Star} label="Satisfacción" value={`${kpis?.satisfaccion_promedio ?? 0}/5`} sub={`${satis?.global?.total ?? 0} encuestas`} accent="bg-amber-500" />
            <Kpi icon={TrendingUp} label="Tasa final." value={`${kpis?.tasa_finalizacion ?? 0}%`} accent="bg-emerald-700" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2 bg-white/70 backdrop-blur-md border-white/40">
              <h3 className="text-sm font-bold text-[#001550] mb-3">Atenciones por hora</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={horaChart}>
                  <defs>
                    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR_ACC} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={COLOR_ACC} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke={COLOR_MID} strokeWidth={2} fill="url(#gArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
              <h3 className="text-sm font-bold text-[#001550] mb-3">Distribución de estados</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={estadoChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                    {estadoChart.map((_, i) => (
                      <Cell key={i} fill={[COLOR_MAIN, COLOR_MID, COLOR_ACC, "#f59e0b", "#94a3b8"][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
              <h3 className="text-sm font-bold text-[#001550] mb-3">Atenciones por sede</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sedesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="sede" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="atenciones" fill={COLOR_MID} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="espera" fill={COLOR_ACC} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
              <h3 className="text-sm font-bold text-[#001550] mb-3">Tendencia 7 días</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={COLOR_MAIN} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Ranking */}
          {ranking.length > 0 && (
            <Card className="p-5 bg-gradient-to-br from-[#001550] to-[#013084] text-white border-0 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Top satisfacción
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ranking.map((a: any, i: number) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">#{i + 1}</span>
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <p className="font-semibold">{a.nombre}</p>
                    <p className="text-[11px] opacity-80">{a.sede_codigo ?? "—"}</p>
                    <div className="mt-2 flex justify-between text-xs">
                      <span>Satisfacción</span><span className="font-bold">{Number(a.satisfaccion ?? 0).toFixed(2)}/5</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Atendidos hoy</span><span className="font-bold">{a.atendidos_hoy}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Sedes */}
          <div>
            <h2 className="text-lg font-bold text-[#001550] mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Sedes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sedes.map((s: any) => (
                <Card key={s.id} className="p-5 bg-white/70 backdrop-blur-md border-white/40">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#0699d9] font-bold">{s.codigo}</p>
                      <h3 className="text-lg font-bold text-[#001550]">{s.nombre}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-500">Satisfacción</p>
                      <p className="text-lg font-bold text-amber-500">{s.satisfaccion ? `${s.satisfaccion}/5` : "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { l: "Hoy", v: s.turnos_hoy }, { l: "Espera", v: s.en_espera },
                      { l: "Atención", v: s.en_atencion }, { l: "Final.", v: s.finalizados },
                    ].map((x) => (
                      <div key={x.l} className="rounded-xl bg-slate-50 p-2">
                        <p className="text-[10px] uppercase text-slate-500">{x.l}</p>
                        <p className="text-xl font-bold text-[#013084] tabular-nums">{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-600">
                    <span><Activity className="w-3 h-3 inline mr-1" />{s.asesoras_activas}/{s.asesoras_total} asesoras</span>
                    <span><Clock className="w-3 h-3 inline mr-1" />{s.tiempo_promedio} min prom.</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Asesoras */}
          <div>
            <h2 className="text-lg font-bold text-[#001550] mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" /> Asesoras operativas
            </h2>
            <Card className="bg-white/70 backdrop-blur-md border-white/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="text-left p-3">Asesora</th>
                      <th className="text-left p-3">Estado</th>
                      <th className="text-left p-3">Sede</th>
                      <th className="text-left p-3">Horario</th>
                      <th className="text-center p-3">Hoy</th>
                      <th className="text-center p-3">Semana</th>
                      <th className="text-center p-3">Mes</th>
                      <th className="text-left p-3">Capacidad</th>
                      <th className="text-center p-3">T. prom.</th>
                      <th className="text-center p-3">⭐</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asesoras.map((a: any) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001550] to-[#0699d9] flex items-center justify-center text-white text-xs font-bold">
                              {a.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                            </div>
                            <span className="font-semibold text-[#001550]">{a.nombre}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${ESTADO_COLOR[a.estado_op] ?? "bg-slate-300"} ${a.estado_op === "ocupada" ? "animate-pulse" : ""}`} />
                            {ESTADO_LABEL[a.estado_op] ?? a.estado_op}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{a.sede_codigo ?? "—"}</td>
                        <td className="p-3 text-xs text-slate-600 tabular-nums">{a.hora_inicio?.slice(0, 5)}–{a.hora_fin?.slice(0, 5)}</td>
                        <td className="p-3 text-center font-bold text-[#013084] tabular-nums">{a.atendidos_hoy}</td>
                        <td className="p-3 text-center text-slate-700 tabular-nums">{a.atendidos_semana}</td>
                        <td className="p-3 text-center text-slate-700 tabular-nums">{a.atendidos_mes}</td>
                        <td className="p-3 min-w-32">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(100, Number(a.ocupacion ?? 0))} className="h-1.5 w-20" />
                            <span className="text-[11px] text-slate-500 tabular-nums">{a.carga_actual}/{a.max_capacidad}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-xs text-slate-600 tabular-nums">{a.tiempo_promedio_min}m</td>
                        <td className="p-3 text-center">
                          {a.satisfaccion ? (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                              <Star className="w-3 h-3 fill-amber-400" /> {Number(a.satisfaccion).toFixed(2)}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Satisfacción */}
          {satis && (
            <div>
              <h2 className="text-lg font-bold text-[#001550] mb-3 flex items-center gap-2">
                <Star className="w-5 h-5" /> Satisfacción (solo dirección)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Kpi icon={Star} label="Global" value={`${satis.global.promedio}/5`} sub={`${satis.global.total} encuestas`} accent="bg-amber-500" />
                <Kpi icon={Users} label="Atención" value={`${satis.global.atencion}/10`} accent="bg-[#013084]" />
                <Kpi icon={Clock} label="Tiempo" value={`${satis.global.tiempo}/10`} accent="bg-[#0699d9]" />
                <Kpi icon={FileSignature} label="Financiero" value={`${satis.global.financiero}/10`} accent="bg-emerald-600" />
                <Kpi icon={TrendingUp} label="NPS" value={`${satis.global.nps}/10`} accent="bg-[#001550]" />
              </div>

              {/* Satisfacción por asesora */}
              {satis.por_asesora?.length > 0 && (
                <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40 mb-4">
                  <h3 className="text-sm font-bold text-[#001550] mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Satisfacción por asesora
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...satis.por_asesora]
                      .sort((a: any, b: any) => Number(b.promedio ?? 0) - Number(a.promedio ?? 0))
                      .map((a: any, idx: number) => {
                        const score = Number(a.promedio ?? 0);
                        const pct = Math.round((score / 5) * 100);
                        const color = score >= 4.5 ? "text-emerald-600" : score >= 3.5 ? "text-amber-500" : score > 0 ? "text-rose-500" : "text-slate-400";
                        return (
                          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                            className="rounded-2xl border border-slate-100 p-4 bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#001550] to-[#0699d9] flex items-center justify-center text-white text-xs font-bold">
                                {a.nombre?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#001550] text-sm truncate">{a.nombre}</p>
                                <p className="text-[10px] text-slate-500">{a.total ?? 0} encuestas</p>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">#{idx + 1}</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className={`text-2xl font-bold tabular-nums ${color}`}>
                                {score > 0 ? score.toFixed(2) : "—"}
                              </span>
                              <span className="text-xs text-slate-400">/5</span>
                              <div className="ml-auto flex">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(score) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                ))}
                              </div>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </motion.div>
                        );
                      })}
                  </div>
                </Card>
              )}

              {satis.comentarios?.length > 0 && (
                <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
                  <h3 className="text-sm font-bold text-[#001550] mb-3">Comentarios recientes</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {satis.comentarios.slice(0, 10).map((c: any) => (
                      <div key={c.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            {[1,2,3,4,5].map((n) => (
                              <Star key={n} className={`w-3 h-3 ${n <= c.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                            ))}
                            <span className="text-slate-500 ml-1">{c.asesora ?? "—"} · {c.sede ?? "—"}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString("es-CO")}</span>
                        </div>
                        <p className="text-sm text-slate-700">{c.comentario}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}