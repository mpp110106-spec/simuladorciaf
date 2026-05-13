import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Handler = (payload: unknown) => void;

export function useRealtime(table: string, onChange: Handler) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table },
        (payload: unknown) => onChange(payload),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onChange]);
}