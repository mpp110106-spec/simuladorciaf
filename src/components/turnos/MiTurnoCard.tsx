import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, UserCircle2, Users, Clock3, CheckCircle2, Loader2, Sparkles, Star } from "lucide-react";
import { useTurnoLive } from "@/hooks/useTurnoLive";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EncuestaSatisfaccion from "@/components/encuesta/EncuestaSatisfaccion";
import { encuestaService } from "@/services/adminService";

const ESTADO_META: Record<string, { label: string; color: string; icon: typeof Ticket }> = {
  pendiente: { label: "En espera", color: "bg-amber-400", icon: Clock3 },
  en_proceso: { label: "En atención", color: "bg-emerald-400", icon: Sparkles },
  finalizado: { label: "Finalizado", color: "bg-slate-300", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-400", icon: CheckCircle2 },
};

interface Props {
  turnoId: string;
}

const MiTurnoCard = ({ turnoId }: Props) => {
  const { data, loading } = useTurnoLive(turnoId);
  const [showEncuesta, setShowEncuesta] = useState(false);
  const yaEnviada = encuestaService.existeParaTurno(turnoId);

  if (loading) {
    return <Skeleton className="h-44 rounded-3xl" />;
  }
  if (!data) return null;

  const meta = ESTADO_META[data.estado] ?? ESTADO_META.pendiente;
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ciaf-blue via-ciaf-blue-hover to-ciaf-light-blue text-white shadow-xl"
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-ciaf-light-blue/30 blur-3xl" aria-hidden />

      <div className="relative p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Tu turno</p>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {String(data.numero).padStart(3, "0")}
              </p>
            </div>
          </div>

          <motion.div
            key={data.estado}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-white/15 ring-1 ring-white/20 px-3 py-1.5"
          >
            <span className={`w-2 h-2 rounded-full ${meta.color} ${data.estado === "en_proceso" ? "animate-pulse" : ""}`} />
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{meta.label}</span>
          </motion.div>
        </div>

        {data.asesor_nombre && (
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Tu asesora</p>
              <p className="text-sm font-semibold">{data.asesor_nombre}</p>
            </div>
          </div>
        )}

        {data.estado === "pendiente" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
                <Users className="w-3 h-3" /> Delante
              </div>
              <p className="text-2xl font-bold tabular-nums mt-1">{data.personas_delante}</p>
            </div>
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
                <Clock3 className="w-3 h-3" /> Estimado
              </div>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {data.tiempo_estimado_min}
                <span className="text-sm font-medium opacity-80"> min</span>
              </p>
            </div>
          </div>
        )}

        {data.estado === "en_proceso" && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-400/20 ring-1 ring-emerald-200/30 p-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm font-medium">Tu asesora te está atendiendo ahora.</p>
          </div>
        )}

        {data.estado === "finalizado" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/15 p-3">
              <CheckCircle2 className="w-4 h-4" />
              <p className="text-sm font-medium">Atención finalizada. ¡Gracias por confiar en CIAF!</p>
            </div>
            {!yaEnviada && (
              <Button onClick={() => setShowEncuesta(true)} className="w-full bg-white text-ciaf-blue hover:bg-white/90 font-semibold">
                <Star className="w-4 h-4 mr-1.5 fill-amber-400 text-amber-400" /> Califica tu experiencia
              </Button>
            )}
          </div>
        )}
      </div>
      <EncuestaSatisfaccion open={showEncuesta} turnoId={turnoId} asesora={data.asesor_nombre} onClose={() => setShowEncuesta(false)} />
    </motion.div>
  );
};

export default MiTurnoCard;