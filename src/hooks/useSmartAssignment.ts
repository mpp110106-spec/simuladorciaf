import { useCallback, useState } from "react";
import { turnosService } from "@/services/turnosService";
import type { Turno, TurnoInsert } from "@/types/turno";
import { canPresencial } from "@/utils/businessHours";

export type SmartAssignmentResult =
  | { ok: true; turno: Turno; replay: boolean }
  | { ok: false; reason: "no_advisor" | "out_of_hours" | "error"; message?: string; turno?: Turno };

/**
 * Hook de asignación inteligente (LRA + fallback virtual).
 * - Llama a la RPC `request_turno` (que internamente usa `assign_advisor` con LRA).
 * - Si el backend no asigna asesora (o estamos fuera de horario) → reason="no_advisor"|"out_of_hours".
 * - El consumidor decide cómo presentar el fallback virtual.
 */
export function useSmartAssignment() {
  const [assigning, setAssigning] = useState(false);
  const [lastResult, setLastResult] = useState<SmartAssignmentResult | null>(null);

  const assign = useCallback(async (input: TurnoInsert): Promise<SmartAssignmentResult> => {
    setAssigning(true);
    try {
      if (!canPresencial()) {
        const r: SmartAssignmentResult = { ok: false, reason: "out_of_hours" };
        setLastResult(r);
        return r;
      }
      const turno = await turnosService.create(input);
      const replay = false; // detectado por el consumidor con su idempotency_key tracking
      if (!turno.asesor_id) {
        const r: SmartAssignmentResult = { ok: false, reason: "no_advisor", turno };
        setLastResult(r);
        return r;
      }
      const r: SmartAssignmentResult = { ok: true, turno, replay };
      setLastResult(r);
      return r;
    } catch (e) {
      const r: SmartAssignmentResult = {
        ok: false, reason: "error",
        message: e instanceof Error ? e.message : "Error inesperado",
      };
      setLastResult(r);
      return r;
    } finally {
      setAssigning(false);
    }
  }, []);

  return { assign, assigning, lastResult };
}