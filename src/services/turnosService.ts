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
    const { data, error } = await supabase
      .from("turnos")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as Turno;
  },
  async updateEstado(id: string, estado: TurnoEstado): Promise<void> {
    const { error } = await supabase.from("turnos").update({ estado }).eq("id", id);
    if (error) throw error;
  },
};