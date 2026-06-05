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
  documento_identidad?: string | null;
  credito_solicitado?: boolean;
  credito_solicitado_at?: string | null;
  credito_solicitado_por?: string | null;
  firmado?: boolean;
  firmado_at?: string | null;
  firmado_por?: string | null;
  sede_id?: string | null;
  observaciones?: string | null;
  atencion_inicio?: string | null;
  atencion_fin?: string | null;
}

export interface TurnoObservacion {
  id: string;
  turno_id: string;
  autor_user_id: string;
  autor_nombre: string;
  autor_rol: string;
  texto: string;
  created_at: string;
}

export interface TurnoDetalle {
  turno: Turno & { sede_codigo?: string | null; sede_nombre?: string | null };
  observaciones: TurnoObservacion[];
  financiacion: {
    id: string;
    estado: string;
    firmado: boolean;
    firma_fecha: string | null;
    monto_solicitado: number | null;
    cuotas: number | null;
    observaciones: string | null;
  } | null;
}

export interface TurnoInsert {
  nombre: string;
  telefono: string;
  correo?: string | null;
  tipificacion: string;
  carrera: string;
  semestre: number;
  simulacion_valor?: number | null;
  sede_id?: string | null;
  idempotency_key?: string;
}