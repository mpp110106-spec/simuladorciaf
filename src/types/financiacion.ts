export type FinanciacionEstado =
  | "pendiente"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "req_documentos"
  | "en_firma"
  | "finalizado";

export interface Financiacion {
  id: string;
  turno_id: string;
  estado: FinanciacionEstado;
  firmado: boolean;
  firma_fecha: string | null;
  observaciones: string | null;
  monto_solicitado: number | null;
  cuotas: number | null;
  created_at: string;
  updated_at: string;
}

export const FINANCIACION_ESTADOS: FinanciacionEstado[] = [
  "pendiente",
  "en_revision",
  "req_documentos",
  "aprobado",
  "en_firma",
  "finalizado",
];

export const FINANCIACION_LABEL: Record<FinanciacionEstado, string> = {
  pendiente: "Solicitud recibida",
  en_revision: "En revisión de crédito",
  req_documentos: "Documentos pendientes",
  aprobado: "Crédito aprobado",
  rechazado: "No aprobado",
  en_firma: "En firma de pagaré",
  finalizado: "Financiación activa",
};