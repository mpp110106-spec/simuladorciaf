import { supabase } from "@/integrations/supabase/client";
import type { Turno, TurnoEstado, TurnoInsert } from "@/types/turno";

export const turnosService = {
  async list(): Promise<Turno[]> {
    const { data, error } = await supabase
      .from("turnos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []) as Turno[];
  },
  async create(input: TurnoInsert): Promise<Turno> {
    const { data, error } = await supabase.rpc("request_turno", {
      p_nombre: input.nombre,
      p_telefono: input.telefono,
      p_correo: input.correo ?? "",
      p_tipificacion: input.tipificacion,
      p_simulacion_valor: input.simulacion_valor ?? undefined,
      p_carrera: input.carrera,
      p_semestre: input.semestre,
      p_sede_id: input.sede_id ?? undefined,
    });
    if (error) throw error;
    const turno = data?.[0];
    if (!turno) {
      throw new Error("No se pudo generar el número de turno.");
    }
    return {
      id: turno.id,
      numero: turno.numero,
      nombre: input.nombre,
      telefono: input.telefono,
      correo: input.correo ?? null,
      tipificacion: input.tipificacion,
      carrera: input.carrera,
      semestre: input.semestre,
      estado: "pendiente",
      prioridad: input.tipificacion === "Financiación" ? "alta" : input.tipificacion === "Consultas" ? "media" : "baja",
      simulacion_valor: input.simulacion_valor ?? null,
      asesor_id: turno.asesor_id ?? null,
      asesor_nombre: turno.asesor_nombre ?? null,
      personas_delante: turno.personas_delante ?? 0,
      tiempo_estimado_min: turno.tiempo_estimado_min ?? 0,
      tiempo_espera: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Turno;
  },
  async updateEstado(id: string, estado: TurnoEstado): Promise<void> {
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) throw error;
  },
};