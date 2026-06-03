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
  is_cross_branch?: boolean;
}

async function fetchLive(turnoId: string): Promise<LiveTurno | null> {
  const { data, error } = await supabase.rpc("get_turno_publico", { p_id: turnoId });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    id: row.id,
    numero: row.numero,
    estado: row.estado,
    asesor_id: row.asesor_id,
    asesor_nombre: row.asesor_nombre ?? null,
    personas_delante: row.personas_delante ?? 0,
    tiempo_estimado_min: row.tiempo_estimado_min ?? 0,
    atencion_inicio: row.atencion_inicio,
    atencion_fin: row.atencion_fin,
    is_cross_branch: !!row.is_cross_branch,
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
    const refresh = () => fetchLive(turnoId).then((r) => active && setData(r));
    refresh().then(() => {
      if (active) {
        setLoading(false);
      }
    });

    const ch = supabase
      .channel(`turno-live-${turnoId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "turnos" },
        () => { refresh(); },
      )
      .subscribe((status) => {
        // Re-hydrate state on (re)connect to avoid stale data after socket drops
        if (status === "SUBSCRIBED") refresh();
      });

    // Safety net: periodic re-sync every 20s and on tab focus
    const interval = setInterval(refresh, 20000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      supabase.removeChannel(ch);
    };
  }, [turnoId]);

  return { data, loading };
}