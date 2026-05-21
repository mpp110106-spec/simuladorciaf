import { useEffect, useState } from "react";

const KEY = "ciaf_turno_activo";

export interface ActiveTurno {
  id?: string;
  numero: number;
  asesor_nombre?: string | null;
  personas_delante?: number;
  tiempo_estimado_min?: number;
  creado_at: number;
}

function read(): ActiveTurno | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as ActiveTurno;
    // Auto-expire after 4h
    if (Date.now() - t.creado_at > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

export function saveActiveTurno(t: Omit<ActiveTurno, "creado_at">) {
  const full: ActiveTurno = { ...t, creado_at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent("ciaf:turno-updated"));
  } catch {
    // ignore
  }
}

export function clearActiveTurno() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("ciaf:turno-updated"));
  } catch {
    // ignore
  }
}

export function useActiveTurno() {
  const [turno, setTurno] = useState<ActiveTurno | null>(() => read());
  useEffect(() => {
    const sync = () => setTurno(read());
    window.addEventListener("storage", sync);
    window.addEventListener("ciaf:turno-updated", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ciaf:turno-updated", sync as EventListener);
    };
  }, []);
  return { turno, clear: clearActiveTurno };
}