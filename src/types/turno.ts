export type TurnoEstado = "pendiente" | "en_proceso" | "finalizado" | "cancelado";
export type TurnoPrioridad = "alta" | "media" | "baja";
export type TurnoTipificacion = "Financiación" | "Consultas" | "Otros";

export interface Turno {
  id: string;
  nombre: string;
  telefono: string;
  correo: string | null;
  tipificacion: TurnoTipificacion | string;
  estado: TurnoEstado | string;
  prioridad: TurnoPrioridad | string;
  simulacion_valor: number | null;
  asesor_id: string | null;
  tiempo_espera: number | null;
  created_at: string;
  updated_at: string;
}

export interface TurnoInsert {
  nombre: string;
  telefono: string;
  correo?: string | null;
  tipificacion: string;
  simulacion_valor?: number | null;
}