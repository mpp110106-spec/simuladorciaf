import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import TurnoForm from "@/components/turnos/TurnoForm";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import { ArrowRight, Ticket, Lock, UserCircle2, Clock3, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageView } from "@/hooks/useTracking";
import { saveActiveTurno } from "@/hooks/useActiveTurno";

interface TicketData {
  numero: number;
  asesor_nombre?: string | null;
  personas_delante?: number;
  tiempo_estimado_min?: number;
}

const Welcome = () => {
  const navigate = useNavigate();
  usePageView("bienvenida_visitada");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [countdown, setCountdown] = useState(10);

  const handleSuccess = (turno: TicketData & { id: string }) => {
    setTicket(turno);
    setCountdown(10);
    saveActiveTurno({
      numero: turno.numero,
      asesor_nombre: turno.asesor_nombre ?? null,
      personas_delante: turno.personas_delante ?? 0,
      tiempo_estimado_min: turno.tiempo_estimado_min ?? 0,
    });
    try {
      localStorage.setItem("ciaf_turno_numero", String(turno.numero));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!ticket) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [ticket, countdown]);

  return (
    <>
      <Helmet>
        <title>Solicita tu turno | CIAF</title>
        <meta name="description" content="Solicita tu turno con un asesor CIAF y continúa con tu simulación de crédito educativo." />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/40 via-background to-background py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-ciaf-blue mb-2">Bienvenido a CIAF</h1>
            <p className="text-muted-foreground">
              Para brindarte una atención personalizada, solicita tu turno antes de continuar al simulador de créditos.
            </p>
          </header>

          <TurnoForm onSuccess={handleSuccess} />

        </div>

        <footer className="mt-10 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-ciaf-blue transition-colors"
            aria-label="Acceso colaboradores CIAF"
          >
            <Lock className="w-3 h-3" />
            Acceso colaboradores
          </button>
        </footer>
      </main>

      <AnimatePresence>
        {ticket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ciaf-blue/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ciaf-blue via-ciaf-blue-hover to-ciaf-light-blue text-white shadow-2xl"
            >
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
              <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-ciaf-light-blue/30 blur-3xl" aria-hidden />

              <div className="relative p-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Tu turno</p>
                    <h2 className="text-xl font-semibold leading-tight">Confirmado con éxito</h2>
                  </div>
                </div>

                <div className="text-center py-2">
                  <p className="text-[11px] uppercase tracking-[0.25em] opacity-70 mb-1">Número de turno</p>
                  <p className="text-7xl font-bold tabular-nums leading-none">
                    {String(ticket.numero).padStart(3, "0")}
                  </p>
                </div>

                {ticket.asesor_nombre && (
                  <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                      <UserCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-70">Asesora asignada</p>
                      <p className="text-base font-semibold">{ticket.asesor_nombre}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {(ticket.personas_delante ?? 0) > 0 && (
                    <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
                        <Users className="w-3 h-3" /> Delante
                      </div>
                      <p className="text-2xl font-bold tabular-nums mt-1">{ticket.personas_delante}</p>
                    </div>
                  )}
                  {(ticket.tiempo_estimado_min ?? 0) > 0 && (
                    <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
                        <Clock3 className="w-3 h-3" /> Estimado
                      </div>
                      <p className="text-2xl font-bold tabular-nums mt-1">
                        {ticket.tiempo_estimado_min}<span className="text-sm font-medium opacity-80"> min</span>
                      </p>
                    </div>
                  )}
                  {(ticket.personas_delante ?? 0) === 0 && (
                    <div className="col-span-2 rounded-xl bg-white/10 ring-1 ring-white/15 p-3 text-center">
                      <p className="text-sm font-medium">
                        ¡Eres el siguiente! Tu asesora te atenderá enseguida.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => navigate("/simulador")}
                    className="flex-1 bg-white text-ciaf-blue hover:bg-white/90 font-semibold"
                  >
                    Continuar al simulador <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setTicket(null)}
                    disabled={countdown > 0}
                    className="text-white hover:bg-white/15 disabled:opacity-60"
                  >
                    {countdown > 0 ? `Cerrar (${countdown}s)` : "Cerrar"}
                  </Button>
                </div>

                <p className="text-[11px] text-center opacity-70">
                  Tu número de turno permanecerá visible mientras navegas.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Welcome;