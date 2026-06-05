import { supabase } from "@/integrations/supabase/client";
import type { TurnoDetalle } from "@/types/turno";

export const detalleService = {
  async get(turnoId: string): Promise<TurnoDetalle> {
    const { data, error } = await supabase.rpc("get_turno_detalle", { p_turno_id: turnoId });
    if (error) throw error;
    return data as unknown as TurnoDetalle;
  },
  async addObservacion(turnoId: string, texto: string): Promise<void> {
    const { error } = await supabase.rpc("add_turno_observacion", {
      p_turno_id: turnoId,
      p_texto: texto,
    });
    if (error) throw error;
  },
  async markCredito(turnoId: string, solicitado: boolean): Promise<void> {
    const { error } = await supabase.rpc("mark_credito_solicitado", {
      p_turno_id: turnoId,
      p_solicitado: solicitado,
    });
    if (error) throw error;
  },
  async markFirma(turnoId: string, firmado: boolean): Promise<void> {
    const { error } = await supabase.rpc("mark_firma_estudiante", {
      p_turno_id: turnoId,
      p_firmado: firmado,
    });
    if (error) throw error;
  },
  async setDocumento(turnoId: string, documento: string): Promise<void> {
    const { error } = await supabase.rpc("set_turno_documento", {
      p_turno_id: turnoId,
      p_documento: documento,
    });
    if (error) throw error;
  },
};

export const FORMULARIO_CREDITO_PUBLICO = "https://ciaf.digital/inscribete/";