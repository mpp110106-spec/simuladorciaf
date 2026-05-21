import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Turno } from "@/types/turno";

export function useMisTurnos(asesorId: string | null) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!asesorId) { setTurnos([]); setLoading(false); return; }
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .eq("asesor_id", asesorId)
      .eq("turno_fecha", today)
      .order("numero", { ascending: true });
    setTurnos((data ?? []) as Turno[]);
    setLoading(false);
  }, [asesorId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!asesorId) return;
    const channel = supabase
      .channel(`mis-turnos-${asesorId}`)
      .on("postgres_changes" as never,
        { event: "*", schema: "public", table: "turnos", filter: `asesor_id=eq.${asesorId}` },
        () => void refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [asesorId, refresh]);

  return { turnos, loading, refresh };
}