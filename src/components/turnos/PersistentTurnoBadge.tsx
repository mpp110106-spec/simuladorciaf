import { Ticket, X, UserCircle2, Sparkles, Clock3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useActiveTurno } from "@/hooks/useActiveTurno";
import { useTurnoLive } from "@/hooks/useTurnoLive";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const HIDDEN_ROUTES = ["/auth"];

const PersistentTurnoBadge = () => {
  const { turno, clear } = useActiveTurno();
  const { pathname } = useLocation();
  const { data: live } = useTurnoLive(turno?.id ?? null);
  const lastEstado = useRef<string | null>(null);

  useEffect(() => {
    if (!live) return;
    if (lastEstado.current && lastEstado.current !== live.estado) {
      if (live.estado === "en_proceso") {
        toast.success("Tu asesora ya inició tu atención", {
          description: live.asesor_nombre ? `${live.asesor_nombre} te está atendiendo.` : undefined,
        });
      } else if (live.estado === "finalizado") {
        toast.success("Atención finalizada", { description: "Gracias por confiar en CIAF." });
      }
    }
    lastEstado.current = live.estado;
  }, [live]);

  if (!turno) return null;
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const numeroFmt = String(turno.numero).padStart(3, "0");
  const asesorNombre = live?.asesor_nombre ?? turno.asesor_nombre;
  const estado = live?.estado ?? "pendiente";
  const personas = live?.personas_delante ?? turno.personas_delante ?? 0;

  const estadoLabel =
    estado === "en_proceso" ? "En atención" :
    estado === "finalizado" ? "Finalizado" :
    estado === "cancelado" ? "Cancelado" :
    personas === 0 ? "Eres el siguiente" : "En espera";

  const estadoDot =
    estado === "en_proceso" ? "bg-emerald-300 animate-pulse" :
    estado === "finalizado" ? "bg-slate-300" :
    estado === "cancelado" ? "bg-red-300" :
    "bg-amber-300";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -24, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="fixed top-3 left-3 z-[60] select-none"
        role="status"
        aria-live="polite"
      >
        <div className="group relative flex items-stretch gap-0 rounded-2xl border border-white/10 bg-gradient-to-br from-ciaf-blue via-ciaf-blue-hover to-ciaf-light-blue text-white shadow-[0_10px_40px_-12px_hsl(var(--ciaf-blue)/0.6)] backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-2 pl-3 pr-2 py-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider opacity-80">Turno activo</p>
              <p className="text-lg font-bold tabular-nums -mt-0.5">{numeroFmt}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 border-l border-white/10 bg-white/5">
            <span className={`w-2 h-2 rounded-full ${estadoDot}`} />
            <span className="text-[11px] font-semibold">{estadoLabel}</span>
          </div>
          {asesorNombre && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 border-l border-white/10 bg-white/5">
              <UserCircle2 className="w-4 h-4 opacity-80" />
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Asesora</p>
                <p className="text-xs font-semibold -mt-0.5">{asesorNombre}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            aria-label="Ocultar turno"
            className="px-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersistentTurnoBadge;