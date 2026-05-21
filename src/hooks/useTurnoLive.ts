import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveTurno {
  id: string;
  numero: number;
  estado: string;
  asesor_id: string | null;
  asesor_nombre: string | null;
  personas_delante: number;
  tiempo_estimado_min: number;
  atencion_inicio: string | null;
  atencion_fin: string | null;
}

async function fetchLive(turnoId: string): Promise<LiveTurno | null> {
  const { data: t, error } = await supabase
    .from("turnos")
    .select("id, numero, estado, asesor_id, atencion_inicio, atencion_fin, turno_fecha")
    .eq("id", turnoId)
    .maybeSingle();
  if (error || !t) return null;

  let asesor_nombre: string | null = null;
  let tiempo_promedio = 15;
  if (t.asesor_id) {
    const { data: a } = await supabase
      .from("asesores")
      .select("nombre, tiempo_promedio_min")
      .eq("id", t.asesor_id)
      .maybeSingle();
    if (a) {
      asesor_nombre = a.nombre;
      tiempo_promedio = a.tiempo_promedio_min ?? 15;
    }
  }

  let personas = 0;
  if (t.asesor_id && (t.estado === "pendiente" || t.estado === "en_proceso")) {
    const { count } = await supabase
      .from("turnos")
      .select("id", { count: "exact", head: true })
      .eq("asesor_id", t.asesor_id)
      .eq("turno_fecha", t.turno_fecha)
      .in("estado", ["pendiente", "en_proceso"])
      .lt("numero", t.numero);
    personas = count ?? 0;
  }

  return {
    id: t.id,
    numero: t.numero,
    estado: t.estado,
    asesor_id: t.asesor_id,
    asesor_nombre,
    personas_delante: personas,
    tiempo_estimado_min: personas * tiempo_promedio,
    atencion_inicio: t.atencion_inicio,
    atencion_fin: t.atencion_fin,
  };
}

export function useTurnoLive(turnoId: string | null | undefined) {
  const [data, setData] = useState<LiveTurno | null>(null);
  const [loading, setLoading] = useState(!!turnoId);

  useEffect(() => {
    if (!turnoId) {
      setData(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchLive(turnoId).then((r) => {
      if (active) {
        setData(r);
        setLoading(false);
      }
    });

    const ch = supabase
      .channel(`turno-live-${turnoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "turnos" },
        () => {
          fetchLive(turnoId).then((r) => active && setData(r));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [turnoId]);

  return { data, loading };
}