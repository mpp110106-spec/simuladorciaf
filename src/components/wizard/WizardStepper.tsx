import { useLocation, useNavigate } from "react-router-dom";
import { Check, Circle, ChevronLeft, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useFlow } from "@/stores/flowStore";
import { useState } from "react";
import BackConfirmDialog from "./BackConfirmDialog";

interface Paso {
  id: string;
  label: string;
  ruta: string;
  visibleSi?: (modalidad: string | null) => boolean;
}

const PASOS: Paso[] = [
  { id: "modalidad", label: "Modalidad", ruta: "/" },
  { id: "turno", label: "Turno", ruta: "/sede", visibleSi: (m) => m === "sede" },
  { id: "simulacion", label: "Simulación", ruta: "/simulador" },
  { id: "financiacion", label: "Financiación", ruta: "/financiacion", visibleSi: (_m) => true },
];

// Rutas donde NO debe mostrarse el stepper (admin)
const RUTAS_OCULTAS = ["/dashboard", "/turnos", "/analytics", "/auth"];

const WizardStepper = () => {
  const { state } = useFlow();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmar, setConfirmar] = useState<{ ruta: string; label: string } | null>(null);

  if (RUTAS_OCULTAS.some((r) => location.pathname.startsWith(r))) return null;

  const pasosVisibles = PASOS.filter((p) => !p.visibleSi || p.visibleSi(state.modalidad));
  const activoIdx = pasosVisibles.findIndex((p) => p.ruta === location.pathname);

  const hayDatos =
    !!state.datos.nombre ||
    !!state.datos.telefono ||
    !!state.datos.carrera ||
    !!state.turno ||
    !!state.simulacion;

  const irA = (paso: Paso) => {
    if (paso.ruta === location.pathname) return;
    if (hayDatos && activoIdx >= 0 && pasosVisibles.indexOf(paso) < activoIdx) {
      setConfirmar({ ruta: paso.ruta, label: paso.label });
    } else {
      navigate(paso.ruta);
    }
  };

  const volver = () => {
    if (activoIdx > 0) {
      const previo = pasosVisibles[activoIdx - 1];
      if (hayDatos) setConfirmar({ ruta: previo.ruta, label: previo.label });
      else navigate(previo.ruta);
    } else {
      navigate(-1);
    }
  };

  const completado = (id: string) => state.pasosCompletados.includes(id);

  return (
    <>
      <div className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/55">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={volver}
            className="group inline-flex items-center gap-1 rounded-full border border-ciaf-blue/15 bg-white/60 px-2.5 py-1 text-xs font-medium text-ciaf-blue transition-all hover:bg-ciaf-blue hover:text-white"
            aria-label="Volver al paso anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <ol className="flex flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
            {pasosVisibles.map((p, i) => {
              const activo = i === activoIdx;
              const hecho = completado(p.id);
              const habilitado = hecho || i <= Math.max(activoIdx, 0);
              return (
                <li key={p.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!habilitado}
                    onClick={() => irA(p)}
                    className={`group flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-all ${
                      activo
                        ? "bg-ciaf-blue text-white shadow-sm"
                        : hecho
                        ? "text-ciaf-blue hover:bg-ciaf-blue/10"
                        : habilitado
                        ? "text-foreground/60 hover:bg-foreground/5"
                        : "text-foreground/30 cursor-not-allowed"
                    }`}
                    title={hecho ? `Editar ${p.label}` : p.label}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        activo
                          ? "bg-white text-ciaf-blue"
                          : hecho
                          ? "bg-ciaf-blue text-white"
                          : "bg-foreground/10 text-foreground/50"
                      }`}
                    >
                      {hecho ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{p.label}</span>
                    {hecho && !activo && (
                      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
                    )}
                  </button>
                  {i < pasosVisibles.length - 1 && (
                    <div className="relative h-px w-4 sm:w-8 overflow-hidden rounded-full bg-foreground/15">
                      {i < activoIdx && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          className="absolute inset-0 origin-left bg-ciaf-blue"
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {state.modalidad && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-ciaf-blue/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ciaf-blue">
              <Circle className="h-2 w-2 fill-current" />
              {state.modalidad === "sede" ? "Presencial" : "Virtual"}
            </span>
          )}
        </div>
      </div>

      <BackConfirmDialog
        open={!!confirmar}
        destino={confirmar?.label ?? ""}
        onCancel={() => setConfirmar(null)}
        onConfirm={() => {
          const ruta = confirmar?.ruta;
          setConfirmar(null);
          if (ruta) navigate(ruta);
        }}
      />
    </>
  );
};

export default WizardStepper;
