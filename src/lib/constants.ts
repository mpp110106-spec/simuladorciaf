import type { TurnoEstado, TurnoPrioridad, TurnoTipificacion } from "@/types/turno";

export const TIPIFICACIONES: TurnoTipificacion[] = ["Financiación", "Consultas", "Otros"];

export const ESTADOS: TurnoEstado[] = ["pendiente", "en_proceso", "finalizado", "cancelado"];

export const ESTADO_LABEL: Record<TurnoEstado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const PRIORIDAD_LABEL: Record<TurnoPrioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const ESTADO_BADGE: Record<TurnoEstado, string> = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  en_proceso: "bg-ciaf-blue-light text-ciaf-blue border-ciaf-blue/30",
  finalizado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelado: "bg-rose-100 text-rose-800 border-rose-200",
};

export const PRIORIDAD_BADGE: Record<TurnoPrioridad, string> = {
  alta: "bg-rose-100 text-rose-800 border-rose-200",
  media: "bg-amber-100 text-amber-800 border-amber-200",
  baja: "bg-slate-100 text-slate-700 border-slate-200",
};