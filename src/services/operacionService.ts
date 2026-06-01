import { supabase } from "@/integrations/supabase/client";
import type { AsesorEstado } from "@/types/asesora";

export const operacionService = {
  async startAtencion(turnoId: string) {
    const { error } = await supabase.rpc("start_atencion", { p_turno_id: turnoId });
    if (error) throw error;
  },
  async finishAtencion(turnoId: string, observaciones?: string) {
    const { error } = await supabase.rpc("finish_atencion", {
      p_turno_id: turnoId,
      p_observaciones: observaciones ?? null,
    });
    if (error) throw error;
  },
  async setEstado(estado: AsesorEstado) {
    const { error } = await supabase.rpc("set_asesor_estado", { p_estado: estado });
    if (error) throw error;
  },
  async callNext(): Promise<string | null> {
    const { data, error } = await supabase.rpc("call_next_turno");
    if (error) throw error;
    return (data as string | null) ?? null;
  },
  async cancelTurno(turnoId: string) {
    const { error } = await supabase.from("turnos").update({ estado: "cancelado" }).eq("id", turnoId);
    if (error) throw error;
  },
  async takeTurno(turnoId: string): Promise<void> {
    const { error } = await supabase.rpc("take_turno", { p_turno_id: turnoId });
    if (error) throw error;
  },
  async updateHorario(id: string, patch: { hora_inicio?: string; hora_fin?: string; pausa_inicio?: string | null; pausa_fin?: string | null; max_capacidad?: number }) {
    const { error } = await supabase.from("asesores").update(patch).eq("id", id);
    if (error) throw error;
  },
  async heartbeat() {
    const { error } = await supabase.rpc("asesor_heartbeat");
    if (error) throw error;
  },
};