import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LogOut, Settings, PhoneCall, Users, Clock, CheckCircle2, Hourglass, Zap, Loader2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMiAsesora } from "@/hooks/useMiAsesora";
import { useMisTurnos } from "@/hooks/useMisTurnos";
import { useColaSede } from "@/hooks/useColaSede";
import { operacionService } from "@/services/operacionService";
import EstadoSelector from "@/components/operacion/EstadoSelector";
import TurnoCard from "@/components/operacion/TurnoCard";
import FinishModal from "@/components/operacion/FinishModal";
import HorarioModal from "@/components/operacion/HorarioModal";
import EncuestaModal from "@/components/operacion/EncuestaModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Turno } from "@/types/turno";
import type { AsesorEstado } from "@/types/asesora";

const Kpi = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) => (
  <Card className="p-4 border-white/40 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
        <div className="text-2xl font-bold text-[#001550] leading-tight">{value}</div>
      </div>
    </div>
  </Card>
);

export default function Operacion() {
  const { signOut } = useAuth();
  const { asesora, loading: loadingA, refresh: refreshA } = useMiAsesora();
  const { turnos, loading: loadingT } = useMisTurnos(asesora?.id ?? null);
  const { turnos: cola, loading: loadingCola } = useColaSede(asesora?.sede_id ?? null);
  const [finishTarget, setFinishTarget] = useState<Turno | null>(null);
  const [showHorario, setShowHorario] = useState(false);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [showEncuesta, setShowEncuesta] = useState(false);

  // Deduplicación del modal de encuesta sincronizada con el backend:
  // marcamos `encuesta_modal_shown_at` en `turnos` vía RPC atómico, así
  // funciona entre dispositivos y navegadores. Mantenemos un caché local
  // sólo para evitar la llamada redundante en la misma sesión.
  const ENCUESTA_KEY = "ciaf.encuesta.shown.turnos";
  const getLocalShown = (): Set<string> => {
    try {
      const raw = localStorage.getItem(ENCUESTA_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  };
  const markLocalShown = (id: string) => {
    try {
      const set = getLocalShown();
      set.add(id);
      const arr = Array.from(set).slice(-200);
      localStorage.setItem(ENCUESTA_KEY, JSON.stringify(arr));
    } catch { /* noop */ }
  };

  // Heartbeat de presencia: cada 30s mientras el panel esté abierto.
  // Asegura que la asignación automática solo entregue turnos a quien esté realmente conectada.
  useEffect(() => {
    if (!asesora) return;
    let cancelled = false;
    const beat = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      void operacionService.heartbeat();
    };
    beat();
    const iv = window.setInterval(beat, 30000);
    const onVis = () => beat();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [asesora?.id]);

  const stats = useMemo(() => {
    const pendientes = turnos.filter((t) => t.estado === "pendiente");
    const enProceso = turnos.filter((t) => t.estado === "en_proceso");
    const finalizados = turnos.filter((t) => t.estado === "finalizado");
    return {
      total: turnos.length,
      pendientes,
      enProceso,
      finalizados,
    };
  }, [turnos]);

  if (loadingA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#013084]" />
      </div>
    );
  }

  if (!asesora) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-lg font-bold text-[#001550]">Acceso no autorizado</h2>
          <p className="text-sm text-slate-600 mt-2">
            Tu cuenta no está vinculada a un perfil de asesora operativa.
          </p>
          <Button onClick={signOut} variant="outline" className="mt-4">Cerrar sesión</Button>
        </Card>
      </div>
    );
  }

  const handleEstado = async (e: AsesorEstado) => {
    try {
      await operacionService.setEstado(e);
      await refreshA();
      toast.success("Estado actualizado");
    } catch { toast.error("No se pudo cambiar el estado"); }
  };

  const handleStart = async (id: string) => {
    try { await operacionService.startAtencion(id); toast.success("Atención iniciada"); }
    catch { toast.error("No se pudo iniciar"); }
  };
  const handleFinish = async (obs: string) => {
    if (!finishTarget) return;
    const turnoId = finishTarget.id;
    try {
      await operacionService.finishAtencion(turnoId, obs);
      toast.success("Atención finalizada");
      if (getLocalShown().has(turnoId)) return;
      // Marca atómica en el backend: devuelve true solo si fue la primera vez.
      const { data: firstTime, error } = await supabase.rpc(
        "mark_encuesta_modal_shown",
        { p_turno_id: turnoId } as never
      );
      if (!error && firstTime === true) {
        markLocalShown(turnoId);
        setShowEncuesta(true);
      } else if (!error) {
        // Ya se había mostrado en otro dispositivo/navegador.
        markLocalShown(turnoId);
      }
    } catch { toast.error("No se pudo finalizar"); }
  };
  const handleCancel = async (id: string) => {
    try { await operacionService.cancelTurno(id); toast.success("Turno cancelado"); }
    catch { toast.error("No se pudo cancelar"); }
  };
  const handleTake = async (id: string) => {
    setTakingId(id);
    try {
      await operacionService.takeTurno(id);
      toast.success("Turno tomado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo tomar el turno");
    } finally {
      setTakingId(null);
    }
  };
  const handleSaveHorario = async (patch: Parameters<typeof operacionService.updateHorario>[1]) => {
    try { await operacionService.updateHorario(asesora.id, patch); await refreshA(); toast.success("Jornada actualizada"); }
    catch { toast.error("No se pudo guardar"); }
  };

  const cap = `${stats.pendientes.length + stats.enProceso.length}/${asesora.max_capacidad}`;
  const capPct = Math.min(100, ((stats.pendientes.length + stats.enProceso.length) / asesora.max_capacidad) * 100);

  return (
    <>
      <Helmet>
        <title>Operación · {asesora.nombre} | CIAF</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#001550]/5 via-slate-50 to-[#0699d9]/5">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#001550] to-[#0699d9] flex items-center justify-center text-white font-bold shadow-lg">
                {asesora.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Operación</div>
                <div className="text-base font-bold text-[#001550] leading-tight">{asesora.nombre}</div>
                <div className="text-xs text-slate-500">
                  Jornada {asesora.hora_inicio?.slice(0, 5)} – {asesora.hora_fin?.slice(0, 5)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <EstadoSelector value={asesora.estado_op} onChange={handleEstado} />
              <Button variant="outline" size="sm" onClick={() => setShowHorario(true)} className="bg-white/80 backdrop-blur border-white/40">
                <Settings className="w-4 h-4 mr-1.5" /> Jornada
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500">
                <LogOut className="w-4 h-4 mr-1" /> Salir
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Kpi icon={Users} label="Total hoy" value={stats.total} accent="bg-[#001550]" />
            <Kpi icon={Hourglass} label="En espera" value={stats.pendientes.length} accent="bg-amber-500" />
            <Kpi icon={Zap} label="En atención" value={stats.enProceso.length} accent="bg-[#0699d9]" />
            <Kpi icon={CheckCircle2} label="Finalizados" value={stats.finalizados.length} accent="bg-emerald-600" />
            <Kpi icon={Clock} label="Tiempo prom." value={`${asesora.tiempo_promedio_min} min`} accent="bg-[#013084]" />
          </div>

          {/* Capacidad */}
          <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Capacidad actual</div>
                <div className="text-xl font-bold text-[#001550]">{cap}</div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={capPct} className="w-48 h-2" />
                <div className="text-xs text-slate-500">
                  Selección manual desde la cola compartida
                </div>
              </div>
            </div>
          </Card>

          {/* Cola compartida de la sede */}
          <Card className="p-4 bg-white/70 backdrop-blur-md border-white/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0699d9]" />
                <h2 className="font-semibold text-[#001550]">Estudiantes en Espera</h2>
                <span className="text-xs font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">{cola.length}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Cola compartida de tu sede</div>
            </div>
            {loadingCola ? (
              <div className="h-16 rounded-xl bg-slate-200/40 animate-pulse" />
            ) : cola.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8">No hay estudiantes esperando en tu sede</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/60">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Nombre</th>
                      <th className="py-2 pr-2">Documento</th>
                      <th className="py-2 pr-2">Tipificación</th>
                      <th className="py-2 pr-2">Hora</th>
                      <th className="py-2 pr-2">Espera</th>
                      <th className="py-2 pr-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cola.map((t) => {
                      const created = new Date(t.created_at);
                      const waitMin = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));
                      const hora = created.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                      const canTake = asesora.estado_op === "disponible";
                      return (
                        <tr key={t.id} className="border-b border-white/40 hover:bg-white/40">
                          <td className="py-2 pr-2 font-bold text-[#001550]">#{t.numero}</td>
                          <td className="py-2 pr-2">{t.nombre}</td>
                          <td className="py-2 pr-2 text-slate-600">{t.telefono}</td>
                          <td className="py-2 pr-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#0699d9]/10 text-[#013084] font-semibold">
                              {t.tipificacion}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-slate-500">{hora}</td>
                          <td className="py-2 pr-2">
                            <span className={`text-xs font-semibold ${waitMin > 15 ? "text-rose-600" : waitMin > 5 ? "text-amber-600" : "text-emerald-600"}`}>
                              {waitMin} min
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleTake(t.id)}
                              disabled={takingId === t.id || !canTake}
                              className="bg-gradient-to-r from-[#001550] to-[#013084] hover:from-[#013084] hover:to-[#0699d9] text-white"
                            >
                              {takingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5 mr-1" />}
                              Atender
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {asesora.estado_op !== "disponible" && (
                  <div className="text-[11px] text-amber-600 mt-2">
                    Cambia tu estado a "Disponible" para poder atender estudiantes.
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Column title="Esperando" count={stats.pendientes.length} color="amber" loading={loadingT}>
              <AnimatePresence>
                {stats.pendientes.map((t) => (
                  <TurnoCard key={t.id} turno={t} onStart={handleStart} onCancel={handleCancel} />
                ))}
              </AnimatePresence>
              {!loadingT && stats.pendientes.length === 0 && <Empty msg="Sin turnos pendientes" />}
            </Column>

            <Column title="En atención" count={stats.enProceso.length} color="blue" loading={loadingT}>
              <AnimatePresence>
                {stats.enProceso.map((t) => (
                  <TurnoCard key={t.id} turno={t} onFinish={setFinishTarget} />
                ))}
              </AnimatePresence>
              {!loadingT && stats.enProceso.length === 0 && <Empty msg="Ninguna atención activa" />}
            </Column>

            <Column title="Finalizados" count={stats.finalizados.length} color="emerald" loading={loadingT}>
              <AnimatePresence>
                {stats.finalizados.slice().reverse().map((t) => (
                  <TurnoCard key={t.id} turno={t} />
                ))}
              </AnimatePresence>
              {!loadingT && stats.finalizados.length === 0 && <Empty msg="Aún no finalizas turnos" />}
            </Column>
          </div>
        </main>
      </div>

      <FinishModal turno={finishTarget} onClose={() => setFinishTarget(null)} onConfirm={handleFinish} />
      <HorarioModal open={showHorario} asesora={asesora} onClose={() => setShowHorario(false)} onSave={handleSaveHorario} />
      <EncuestaModal open={showEncuesta} onClose={() => setShowEncuesta(false)} />
    </>
  );
}

const COLOR: Record<string, string> = {
  amber: "from-amber-400 to-amber-500",
  blue: "from-[#0699d9] to-[#013084]",
  emerald: "from-emerald-500 to-emerald-600",
};

function Column({ title, count, color, loading, children }: { title: string; count: number; color: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md p-3 min-h-[300px]">
      <div className="flex items-center justify-between px-1 pb-3 border-b border-white/60 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${COLOR[color]}`} />
          <span className="font-semibold text-slate-700 text-sm">{title}</span>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-3">
        {loading ? <div className="h-24 rounded-xl bg-slate-200/40 animate-pulse" /> : children}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-center text-xs text-slate-400 py-8">{msg}</div>;
}