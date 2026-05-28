import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mantiene vivo el turno del estudiante actualizando `last_activity_at`
 * mientras la pestaña está visible y el turno sigue activo.
 *
 * Frecuencia: cada 60s + al volver a la pestaña.
 * Se detiene cuando el turno deja de existir, ya no es pendiente/en_proceso,
 * o la pestaña se cierra.
 */
export function useTurnoHeartbeat(
  turnoId: string | null | undefined,
  estado: string | null | undefined,
) {
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!turnoId) return;
    if (estado && !["pendiente", "en_proceso"].includes(estado)) return;

    let active = true;

    const ping = async () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.hidden) return;
      // Throttle: nunca más de 1 por cada 20s aunque varios triggers coincidan
      const now = Date.now();
      if (now - lastPingRef.current < 20_000) return;
      lastPingRef.current = now;
      try {
        await supabase.rpc("touch_turno", { p_id: turnoId });
      } catch {
        // silencioso: el cleanup automático tolera fallos puntuales
      }
    };

    // Ping inmediato al montar / cambiar turno
    ping();

    const interval = setInterval(ping, 60_000);
    const onVisibility = () => {
      if (!document.hidden) ping();
    };
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [turnoId, estado]);
}