export type TurnoEstado = "pendiente" | "en_proceso" | "finalizado" | "cancelado";
export type TurnoPrioridad = "alta" | "media" | "baja";
export type TurnoTipificacion = "Financiación" | "Consultas" | "Otros";

export interface Turno {
  id: string;
  numero: number;
  nombre: string;
  telefono: string;
  correo: string | null;
  tipificacion: TurnoTipificacion | string;
  carrera: string | null;
  semestre: number | null;
  estado: TurnoEstado | string;
  prioridad: TurnoPrioridad | string;
  simulacion_valor: number | null;
  asesor_id: string | null;
  asesor_nombre?: string | null;
  personas_delante?: number;
  tiempo_estimado_min?: number;
  tiempo_espera: number | null;
  created_at: string;
  updated_at: string;
  turno_fecha?: string | null;
}

export interface TurnoInsert {
  nombre: string;
  telefono: string;
  correo?: string | null;
  tipificacion: string;
  carrera: string;
  semestre: number;
  simulacion_valor?: number | null;
}