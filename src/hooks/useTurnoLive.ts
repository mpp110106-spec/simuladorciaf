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

    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (!active) return;
      try {
        const ch = supabase
          .channel(`turno-live-${turnoId}-${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "turnos" },
            () => { refresh(); },
          )
          .subscribe((status) => {
            if (!active) return;
            if (status === "SUBSCRIBED") {
              attempt = 0;
              refresh();
            } else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              scheduleRetry();
            }
          });
        currentChannel = ch;
      } catch (err) {
        console.warn("[useTurnoLive] subscribe falló, reintentando", err);
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      if (!active || retryTimer) return;
      // Exponential backoff: 1s, 2s, 4s, 8s, hasta 30s
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
      attempt += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (!active) return;
        if (currentChannel) {
          try { supabase.removeChannel(currentChannel); } catch { /* ignore */ }
          currentChannel = null;
        }
        // Fallback: re-hidratar por RPC mientras se restablece el canal
        refresh();
        connect();
      }, delay);
    };

    connect();

    // Safety net: periodic re-sync every 20s and on tab focus
    const interval = setInterval(refresh, 20000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (currentChannel) {
        try { supabase.removeChannel(currentChannel); } catch { /* ignore */ }
      }
    };
  }, [turnoId]);

  return { data, loading };
}