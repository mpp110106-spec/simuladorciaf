export type AsesorEstado =
  | "disponible"
  | "ocupada"
  | "en_llamada"
  | "en_pausa"
  | "almuerzo"
  | "offline"
  | "jornada_finalizada";

export const ASESOR_ESTADO_LABEL: Record<AsesorEstado, string> = {
  disponible: "Disponible",
  ocupada: "Ocupada",
  en_llamada: "En llamada",
  en_pausa: "En pausa",
  almuerzo: "Almuerzo",
  offline: "Offline",
  jornada_finalizada: "Jornada finalizada",
};

export const ASESOR_ESTADO_DOT: Record<AsesorEstado, string> = {
  disponible: "bg-emerald-500",
  ocupada: "bg-amber-500",
  en_llamada: "bg-blue-500",
  en_pausa: "bg-slate-400",
  almuerzo: "bg-orange-400",
  offline: "bg-slate-300",
  jornada_finalizada: "bg-slate-500",
};

export interface MiAsesora {
  id: string;
  nombre: string;
  correo: string;
  estado_op: AsesorEstado;
  is_online: boolean;
  hora_inicio: string;
  hora_fin: string;
  pausa_inicio: string | null;
  pausa_fin: string | null;
  max_capacidad: number;
  tiempo_promedio_min: number;
  sede_id: string | null;
}