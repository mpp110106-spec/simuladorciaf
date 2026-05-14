import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import TurnoForm from "@/components/turnos/TurnoForm";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import { ArrowRight } from "lucide-react";
import { usePageView } from "@/hooks/useTracking";

const Welcome = () => {
  const navigate = useNavigate();
  usePageView("bienvenida_visitada");

  const handleSuccess = () => {
    setTimeout(() => navigate("/simulador"), 1200);
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

          <TurnoForm onSuccess={handleSuccess} />

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/simulador")}
              className="text-muted-foreground hover:text-ciaf-blue"
            >
              Continuar al simulador <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Welcome;