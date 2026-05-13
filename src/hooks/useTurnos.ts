import { useCallback, useEffect, useState } from "react";
import { turnosService } from "@/services/turnosService";
import { useRealtime } from "@/hooks/useRealtime";
import type { Turno, TurnoEstado } from "@/types/turno";

export function useTurnos() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await turnosService.list();
      setTurnos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando turnos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onChange = useCallback(() => { refresh(); }, [refresh]);
  useRealtime("turnos", onChange);

  const updateEstado = useCallback(async (id: string, estado: TurnoEstado) => {
    setTurnos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
    try {
      await turnosService.updateEstado(id, estado);
    } catch (e) {
      await refresh();
      throw e;
    }
  }, [refresh]);

  return { turnos, loading, error, refresh, updateEstado };
}