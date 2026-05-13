export type AnalyticsEvento =
  | "visita_app"
  | "simulacion_realizada"
  | "turno_creado"
  | "dashboard_visitado"
  | "analytics_visitado"
  | "turnos_visitado";

export interface AnalyticsEvent {
  id: string;
  evento: AnalyticsEvento | string;
  pagina: string | null;
  metadata: Record<string, unknown> | null;
  dispositivo: string | null;
  navegador: string | null;
  sistema_operativo: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AnalyticsInsert {
  evento: string;
  pagina?: string | null;
  metadata?: Record<string, unknown> | null;
  dispositivo?: string | null;
  navegador?: string | null;
  sistema_operativo?: string | null;
  session_id?: string | null;
}