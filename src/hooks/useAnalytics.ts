import { useCallback, useEffect, useState } from "react";
import { analyticsService } from "@/services/analyticsService";
import type { AnalyticsEvent } from "@/types/analytics";

export function useAnalytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await analyticsService.list();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { events, loading, refresh };
}