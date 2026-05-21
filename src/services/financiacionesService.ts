import { supabase } from "@/integrations/supabase/client";
import type { Financiacion, FinanciacionEstado } from "@/types/financiacion";

export const financiacionesService = {
  async createForTurno(input: {
    turno_id: string;
    monto_solicitado?: number | null;
    cuotas?: number | null;
    observaciones?: string | null;
  }): Promise<Financiacion> {
    const { data, error } = await supabase
      .from("financiaciones")
      .insert({
        turno_id: input.turno_id,
        monto_solicitado: input.monto_solicitado ?? null,
        cuotas: input.cuotas ?? null,
        observaciones: input.observaciones ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Financiacion;
  },

  async getById(id: string): Promise<Financiacion | null> {
    const { data, error } = await supabase
      .from("financiaciones")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Financiacion) ?? null;
  },

  async listByTurno(turnoId: string): Promise<Financiacion[]> {
    const { data, error } = await supabase
      .from("financiaciones")
      .select("*")
      .eq("turno_id", turnoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Financiacion[];
  },

  async updateEstado(id: string, estado: FinanciacionEstado, observaciones?: string | null): Promise<void> {
    const payload: Record<string, unknown> = { estado };
    if (observaciones !== undefined) payload.observaciones = observaciones;
    if (estado === "finalizado") {
      payload.firmado = true;
      payload.firma_fecha = new Date().toISOString();
    }
    const { error } = await supabase.from("financiaciones").update(payload).eq("id", id);
    if (error) throw error;
  },

  async marcarFirma(id: string): Promise<void> {
    const { error } = await supabase
      .from("financiaciones")
      .update({ firmado: true, firma_fecha: new Date().toISOString(), estado: "finalizado" })
      .eq("id", id);
    if (error) throw error;
  },
};