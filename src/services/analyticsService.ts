import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsEvent, AnalyticsInsert } from "@/types/analytics";

export const analyticsService = {
  async list(): Promise<AnalyticsEvent[]> {
    const { data, error } = await supabase
      .from("analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []) as AnalyticsEvent[];
  },
  async track(event: AnalyticsInsert): Promise<void> {
    const { error } = await supabase.from("analytics").insert(event);
    if (error) {
      console.warn("[analytics] track failed", error);
    }
  },
};