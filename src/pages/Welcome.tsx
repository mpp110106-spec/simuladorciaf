import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import TurnoForm from "@/components/turnos/TurnoForm";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import { ArrowRight, Ticket, Lock } from "lucide-react";
import { usePageView } from "@/hooks/useTracking";

const Welcome = () => {
  const navigate = useNavigate();
  usePageView("bienvenida_visitada");
  const [turnoNumero, setTurnoNumero] = useState<number | null>(null);

  const handleSuccess = (turno: { id: string; numero: number }) => {
    setTurnoNumero(turno.numero);
    try {
      localStorage.setItem("ciaf_turno_numero", String(turno.numero));
    } catch {
      // ignore
    }
    setTimeout(() => navigate("/simulador"), 3500);
  };

  return (
    <>
      <Helmet>
        <title>Solicita tu turno | CIAF</title>
        <meta name="description" content="Solicita tu turno con un asesor CIAF y continúa con tu simulación de crédito educativo." />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/30 to-background py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-ciaf-blue mb-2">Bienvenido a CIAF</h1>
            <p className="text-muted-foreground">
              Para brindarte una atención personalizada, solicita tu turno antes de continuar al simulador de créditos.
            </p>
          </header>

          {turnoNumero !== null ? (
            <div className="rounded-xl border border-ciaf-blue/20 bg-card shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-ciaf-blue-light flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8 text-ciaf-blue" />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Tu número de turno</p>
              <p className="text-6xl font-bold text-ciaf-blue tabular-nums">
                {String(turnoNumero).padStart(3, "0")}
              </p>
              <p className="text-sm text-muted-foreground">
                Guarda este número. Te llevaremos al simulador en unos segundos…
              </p>
              <Button
                onClick={() => navigate("/simulador")}
                className="bg-ciaf-blue hover:bg-ciaf-blue/90 text-white"
              >
                Ir al simulador ahora <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <TurnoForm onSuccess={handleSuccess} />
          )}

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
    </>
  );
};

export default Welcome;