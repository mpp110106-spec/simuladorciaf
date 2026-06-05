import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";

export interface ColaTurno {
  id: string;
  numero: number;
  nombre: string;
  telefono: string;
  tipificacion: string;
  carrera: string | null;
  semestre: number | null;
  sede_id: string | null;
  created_at: string;
  prioridad: string;
}

/**
 * Cola compartida: turnos pendientes SIN asesora de la sede de la asesora actual.
 * La RLS `turnos_select_cola_sede` ya filtra por sede coincidente.
 */
export function useColaSede(sedeId: string | null | undefined) {
  const [turnos, setTurnos] = useState<ColaTurno[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sedeId) {
      setTurnos([]);
      setLoading(false);
      return;
    }
    const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const fecha = hoy.toISOString().slice(0, 10);
    console.log("fechaaa", fecha);
    const { data, error } = await supabase
      .from("turnos")
      .select("id,numero,nombre,telefono,tipificacion,carrera,semestre,sede_id,created_at,prioridad")
      .is("asesor_id", null)
      .eq("estado", "pendiente")
      .eq("sede_id", sedeId)
      .eq("turno_fecha", fecha)
      .order("prioridad", { ascending: true })
      .order("numero", { ascending: true })
      .limit(200);
    if (!error) setTurnos((data ?? []) as ColaTurno[]);
    setLoading(false);
  }, [sedeId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);
  useRealtime("turnos", refresh);

  return { turnos, loading, refresh };
}
