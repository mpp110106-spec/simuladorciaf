import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { MiAsesora } from "@/types/asesora";

export function useMiAsesora() {
  const { user } = useAuth();
  const [asesora, setAsesora] = useState<MiAsesora | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAsesora(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("asesores")
      .select("id,nombre,correo,estado_op,is_online,hora_inicio,hora_fin,pausa_inicio,pausa_fin,max_capacidad,tiempo_promedio_min")
      .eq("user_id", user.id)
      .maybeSingle();
    setAsesora((data as MiAsesora | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!asesora) return;
    const channel = supabase
      .channel(`asesora-${asesora.id}`)
      .on("postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "asesores", filter: `id=eq.${asesora.id}` },
        () => void refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [asesora?.id, refresh]);

  return { asesora, loading, refresh };
}