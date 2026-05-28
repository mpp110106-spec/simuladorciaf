import { supabase } from "@/integrations/supabase/client";

export const adminService = {
  async kpis() {
    const { data, error } = await supabase.rpc("admin_kpis_globales");
    if (error) throw error;
    return data as Record<string, unknown>;
  },
  async asesoras() {
    const { data, error } = await supabase.rpc("admin_asesoras_resumen");
    if (error) throw error;
    return (data as unknown[]) ?? [];
  },
  async sedes() {
    const { data, error } = await supabase.rpc("admin_sedes_resumen");
    if (error) throw error;
    return (data as unknown[]) ?? [];
  },
  async satisfaccion() {
    const { data, error } = await supabase.rpc("admin_satisfaccion_resumen");
    if (error) throw error;
    return data as Record<string, unknown>;
  },
  async usuarios() {
    const { data, error } = await supabase.rpc("admin_usuarios_resumen");
    if (error) throw error;
    return (data as unknown[]) ?? [];
  },
  async metricasOperativas(from: string, to: string) {
    const { data, error } = await supabase.rpc("admin_metricas_operativas", {
      p_from: from,
      p_to: to,
    } as never);
    if (error) throw error;
    return data as Record<string, unknown>;
  },
  async setSedeAsesora(asesorId: string, sedeId: string) {
    const { error } = await supabase.rpc("admin_set_sede_asesora", { p_asesor_id: asesorId, p_sede_id: sedeId });
    if (error) throw error;
  },
};

export const encuestaService = {
  async create(input: {
    turno_id: string; rating: number;
    atencion_score?: number; tiempo_espera_score?: number;
    proceso_financiero_score?: number; recomendaria_score?: number;
    resolvio_dudas?: boolean; comentario?: string;
  }) {
    const { error } = await supabase.from("encuestas_satisfaccion").insert(input);
    if (error) throw error;
  },
  async existeParaTurno(turnoId: string): Promise<boolean> {
    // Anon no puede SELECT; usamos try-insert con onConflict. Aquí solo guardamos localmente.
    try {
      return localStorage.getItem(`ciaf_encuesta_${turnoId}`) === "1";
    } catch { return false; }
  },
  marcarEnviada(turnoId: string) {
    try { localStorage.setItem(`ciaf_encuesta_${turnoId}`, "1"); } catch { /* ignore */ }
  },
};