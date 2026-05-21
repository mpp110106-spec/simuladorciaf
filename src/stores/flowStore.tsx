import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type Modalidad = "sede" | "virtual" | null;
export type SedeCodigo = "CRAI" | "SEXTA" | null;

export interface DatosEstudiante {
  nombre?: string;
  telefono?: string;
  correo?: string;
  tipificacion?: string;
  carrera?: string;
  semestre?: number;
}

export interface TurnoActivo {
  id: string;
  numero: number;
  asesor_nombre?: string | null;
  personas_delante?: number;
  tiempo_estimado_min?: number;
  programa?: string | null;
}

export interface SimulacionGuardada {
  jornada?: string;
  valorMatricula?: number;
  cuotaInicial?: number;
  numCuotas?: number;
  valorCuota?: number;
  total?: number;
}

export interface FlowState {
  modalidad: Modalidad;
  sedeCodigo: SedeCodigo;
  sedeId: string | null;
  datos: DatosEstudiante;
  turno: TurnoActivo | null;
  financiacionId: string | null;
  simulacion: SimulacionGuardada | null;
  pasosCompletados: string[]; // ids de pasos
}

const DEFAULT: FlowState = {
  modalidad: null,
  sedeCodigo: null,
  sedeId: null,
  datos: {},
  turno: null,
  financiacionId: null,
  simulacion: null,
  pasosCompletados: [],
};

const KEY = "ciaf_flow_state_v1";

function load(): FlowState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as FlowState) };
  } catch {
    return DEFAULT;
  }
}

function save(s: FlowState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

interface FlowContextValue {
  state: FlowState;
  setModalidad: (m: Modalidad) => void;
  setSede: (codigo: SedeCodigo, id: string | null) => void;
  setDatos: (d: Partial<DatosEstudiante>) => void;
  setTurno: (t: TurnoActivo | null) => void;
  setFinanciacionId: (id: string | null) => void;
  setSimulacion: (s: SimulacionGuardada | null) => void;
  marcarPaso: (id: string) => void;
  desmarcarPaso: (id: string) => void;
  resetTurno: () => void;
  resetTodo: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FlowState>(() => load());

  useEffect(() => {
    save(state);
  }, [state]);

  const setModalidad = useCallback((m: Modalidad) => {
    setState((s) => ({
      ...s,
      modalidad: m,
      pasosCompletados: m ? Array.from(new Set([...s.pasosCompletados, "modalidad"])) : s.pasosCompletados.filter((p) => p !== "modalidad"),
    }));
  }, []);

  const setSede = useCallback((codigo: SedeCodigo, id: string | null) => {
    setState((s) => ({
      ...s,
      sedeCodigo: codigo,
      sedeId: id,
      pasosCompletados: codigo ? Array.from(new Set([...s.pasosCompletados, "sede"])) : s.pasosCompletados.filter((p) => p !== "sede"),
    }));
  }, []);

  const setDatos = useCallback((d: Partial<DatosEstudiante>) => {
    setState((s) => ({ ...s, datos: { ...s.datos, ...d } }));
  }, []);

  const setTurno = useCallback((t: TurnoActivo | null) => {
    setState((s) => ({
      ...s,
      turno: t,
      pasosCompletados: t ? Array.from(new Set([...s.pasosCompletados, "turno"])) : s.pasosCompletados.filter((p) => p !== "turno"),
    }));
  }, []);

  const setFinanciacionId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, financiacionId: id }));
  }, []);

  const setSimulacion = useCallback((sim: SimulacionGuardada | null) => {
    setState((s) => ({
      ...s,
      simulacion: sim,
      pasosCompletados: sim ? Array.from(new Set([...s.pasosCompletados, "simulacion"])) : s.pasosCompletados.filter((p) => p !== "simulacion"),
    }));
  }, []);

  const marcarPaso = useCallback((id: string) => {
    setState((s) => ({ ...s, pasosCompletados: Array.from(new Set([...s.pasosCompletados, id])) }));
  }, []);

  const desmarcarPaso = useCallback((id: string) => {
    setState((s) => ({ ...s, pasosCompletados: s.pasosCompletados.filter((p) => p !== id) }));
  }, []);

  const resetTurno = useCallback(() => {
    setState((s) => ({
      ...s,
      turno: null,
      financiacionId: null,
      pasosCompletados: s.pasosCompletados.filter((p) => p !== "turno"),
    }));
  }, []);

  const resetTodo = useCallback(() => {
    setState(DEFAULT);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <FlowContext.Provider
      value={{
        state,
        setModalidad,
        setSede,
        setDatos,
        setTurno,
        setFinanciacionId,
        setSimulacion,
        marcarPaso,
        desmarcarPaso,
        resetTurno,
        resetTodo,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow debe usarse dentro de <FlowProvider>");
  return ctx;
};
