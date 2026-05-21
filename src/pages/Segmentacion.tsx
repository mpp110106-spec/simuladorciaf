import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Globe, ArrowRight, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import { usePageView } from "@/hooks/useTracking";
import { useFlow } from "@/stores/flowStore";

const TURNOS_URL = "/sede";
const CALCULADORA_URL = "/simulador";

type Opcion = "sede" | "virtual";

const Segmentacion = () => {
  const navigate = useNavigate();
  usePageView("segmentacion_visitada");
  const { state, setModalidad } = useFlow();
  const [seleccion, setSeleccion] = useState<Opcion | null>(state.modalidad);
  const [cargando, setCargando] = useState(false);

  const seleccionar = (opcion: Opcion) => {
    if (cargando) return;
    setSeleccion(opcion);
    setModalidad(opcion);
    setCargando(true);
    const destino = opcion === "sede" ? TURNOS_URL : CALCULADORA_URL;
    setTimeout(() => navigate(destino), 900);
  };

  const opciones: Array<{
    id: Opcion;
    icon: typeof Building2;
    titulo: string;
    descripcion: string;
    badge: string;
    accent: string;
    glow: string;
  }> = [
    {
      id: "sede",
      icon: Building2,
      titulo: "Estoy en sede",
      descripcion: "Genera tu turno y recibe atención presencial personalizada.",
      badge: "Atención presencial",
      accent: "from-ciaf-blue to-ciaf-lightBlue",
      glow: "shadow-[0_20px_60px_-15px_hsl(var(--ciaf-blue)/0.45)]",
    },
    {
      id: "virtual",
      icon: Globe,
      titulo: "Soy virtual",
      descripcion: "Continúa directamente con tu simulación de crédito online.",
      badge: "Experiencia 100% digital",
      accent: "from-ciaf-lightBlue to-ciaf-blue",
      glow: "shadow-[0_20px_60px_-15px_hsl(var(--ciaf-light-blue)/0.45)]",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Bienvenido a CIAF | Elige tu experiencia</title>
        <meta
          name="description"
          content="Selecciona si estás en sede o de forma virtual para iniciar tu simulación de crédito CIAF con atención personalizada."
        />
      </Helmet>

      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(210_60%_97%)] via-[hsl(200_50%_94%)] to-[hsl(210_70%_92%)]">
        {/* Background decorativo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-ciaf-blue/20 blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-ciaf-lightBlue/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-ciaf-gold/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8 sm:py-12">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-2 backdrop-blur-md shadow-sm">
              <img src={logoCiaf} alt="CIAF" className="h-8 w-auto" />
              <span className="hidden sm:block h-5 w-px bg-ciaf-blue/20" />
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-ciaf-blue/80">
                <ShieldCheck className="h-3.5 w-3.5" /> Plataforma oficial
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-3 py-1.5 text-xs font-medium text-ciaf-blue/70 backdrop-blur-md transition-all hover:bg-white/80 hover:text-ciaf-blue"
              aria-label="Acceso colaboradores"
            >
              <Lock className="h-3 w-3" />
              <span className="hidden sm:inline">Colaboradores</span>
            </button>
          </motion.header>

          {/* Hero */}
          <div className="flex flex-1 flex-col items-center justify-center py-10 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-10 text-center"
            >
              <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-ciaf-blue/15 bg-white/70 px-3 py-1 text-xs font-medium text-ciaf-blue backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                Bienvenido a CIAF
              </div>
              <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight text-ciaf-blue sm:text-5xl">
                ¿Cómo deseas continuar tu simulación?
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm text-foreground/60 sm:text-base">
                Selecciona el tipo de atención para brindarte una experiencia personalizada.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              {opciones.map((op, idx) => {
                const Icon = op.icon;
                const activa = seleccion === op.id;
                const otra = seleccion !== null && !activa;
                return (
                  <motion.button
                    key={op.id}
                    type="button"
                    onClick={() => seleccionar(op.id)}
                    disabled={cargando}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{
                      opacity: otra ? 0.35 : 1,
                      y: 0,
                      scale: activa ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.5, delay: 0.15 + idx * 0.1 }}
                    whileHover={!cargando ? { y: -6, scale: 1.015 } : undefined}
                    whileTap={!cargando ? { scale: 0.985 } : undefined}
                    className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 text-left backdrop-blur-xl transition-all sm:p-8 ${op.glow} ${activa ? "ring-2 ring-ciaf-blue" : ""} ${cargando ? "cursor-wait" : "cursor-pointer"}`}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${op.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]`} />
                    {/* Top shine */}
                    <div className="pointer-events-none absolute -top-1/2 left-0 right-0 h-full bg-gradient-to-b from-white/50 to-transparent" />

                    <div className="relative">
                      <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${op.accent} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
                      </div>

                      <span className="mb-3 inline-block rounded-full bg-ciaf-blue/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ciaf-blue">
                        {op.badge}
                      </span>

                      <h3 className="mb-2 text-2xl font-bold text-foreground">
                        {op.titulo}
                      </h3>
                      <p className="mb-6 text-sm leading-relaxed text-foreground/60">
                        {op.descripcion}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-semibold text-ciaf-blue">
                        <AnimatePresence mode="wait" initial={false}>
                          {activa && cargando ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparando experiencia…
                            </motion.span>
                          ) : (
                            <motion.span
                              key="cta"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1.5"
                            >
                              Continuar
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-foreground/50"
            >
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Datos seguros</span>
              <span className="hidden sm:inline">•</span>
              <span>Simulación sin costo</span>
              <span className="hidden sm:inline">•</span>
              <span>Atención inmediata</span>
            </motion.div>
          </div>

          <footer className="mt-auto pt-6 text-center text-[11px] text-foreground/40">
            © {new Date().getFullYear()} CIAF · Corporación Instituto de Administración y Finanzas
          </footer>
        </div>

        {/* Overlay loader full screen mientras redirige */}
        <AnimatePresence>
          {cargando && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-5 py-3 shadow-xl backdrop-blur-xl"
              >
                <Loader2 className="h-5 w-5 animate-spin text-ciaf-blue" />
                <span className="text-sm font-medium text-ciaf-blue">
                  {seleccion === "sede" ? "Llevándote a turnos…" : "Abriendo el simulador…"}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
};

export default Segmentacion;