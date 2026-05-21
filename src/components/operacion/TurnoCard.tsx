import { motion } from "framer-motion";
import { Phone, Mail, Play, Square, Pause, GraduationCap, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Turno } from "@/types/turno";
import { getProgramaAcademico } from "@/lib/programas";
import { formatCurrencyCO } from "@/lib/formatters";

interface Props {
  turno: Turno;
  onStart?: (id: string) => void;
  onFinish?: (turno: Turno) => void;
  onCancel?: (id: string) => void;
}

const accent: Record<string, string> = {
  pendiente: "from-amber-400/20 to-amber-300/5 border-amber-200",
  en_proceso: "from-[#0699d9]/25 to-[#013084]/5 border-[#0699d9]/40",
  finalizado: "from-emerald-400/20 to-emerald-300/5 border-emerald-200",
  cancelado: "from-rose-400/20 to-rose-300/5 border-rose-200",
};

export default function TurnoCard({ turno, onStart, onFinish, onCancel }: Props) {
  const programa = getProgramaAcademico(turno.carrera, turno.semestre);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-all",
        accent[turno.estado] ?? accent.pendiente,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Turno</div>
          <div className="text-2xl font-bold text-[#001550] leading-none">
            #{String(turno.numero ?? 0).padStart(3, "0")}
          </div>
        </div>
        {turno.prioridad === "alta" && (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">Prioridad alta</Badge>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="font-semibold text-slate-800 leading-snug">{turno.nombre}</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Phone className="w-3 h-3" /> {turno.telefono}
        </div>
        {turno.correo && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3" /> {turno.correo}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
        <div className="flex items-start gap-1.5 text-slate-600">
          <GraduationCap className="w-3.5 h-3.5 mt-0.5 text-[#013084]" />
          <span className="leading-snug">
            <span className="font-medium">{turno.carrera ?? "—"}</span>
            {turno.semestre ? ` · ${turno.semestre}° sem` : ""}
            {programa && <div className="text-slate-500">{programa}</div>}
          </span>
        </div>
        {turno.simulacion_valor ? (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Banknote className="w-3.5 h-3.5 text-[#0699d9]" />
            <span>{formatCurrencyCO(turno.simulacion_valor)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] font-medium border-slate-300 text-slate-600">
          {turno.tipificacion}
        </Badge>
      </div>

      {(onStart || onFinish || onCancel) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {turno.estado === "pendiente" && onStart && (
            <Button
              size="sm"
              onClick={() => onStart(turno.id)}
              className="bg-[#001550] hover:bg-[#013084] text-white shadow-sm gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Iniciar
            </Button>
          )}
          {turno.estado === "en_proceso" && onFinish && (
            <Button
              size="sm"
              onClick={() => onFinish(turno)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Square className="w-3.5 h-3.5" /> Finalizar
            </Button>
          )}
          {turno.estado === "pendiente" && onCancel && (
            <Button
              size="sm" variant="ghost"
              onClick={() => onCancel(turno.id)}
              className="text-slate-500 hover:text-rose-600 gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Cancelar
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}