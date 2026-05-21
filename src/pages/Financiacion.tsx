import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanciacionTimeline from "@/components/financiacion/FinanciacionTimeline";
import logoCiaf from "@/assets/logo-ciaf-azul.png";

const FinanciacionPage = () => {
  const navigate = useNavigate();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(localStorage.getItem("ciaf_financiacion_id"));
  }, []);

  return (
    <>
      <Helmet>
        <title>Mi estudio de crédito | CIAF</title>
        <meta name="description" content="Sigue el estado de tu solicitud de financiación CIAF en tiempo real." />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/30 via-background to-background py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-14 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-ciaf-blue mb-1">Mi estudio de crédito</h1>
            <p className="text-sm text-muted-foreground">
              Aquí puedes seguir el avance de tu solicitud de financiación.
            </p>
          </header>

          {id ? (
            <FinanciacionTimeline financiacionId={id} />
          ) : (
            <div className="text-center py-14 rounded-2xl border border-dashed border-ciaf-blue/20 bg-card">
              <FileSignature className="w-10 h-10 text-ciaf-blue/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No encontramos un estudio de crédito activo en este dispositivo.
              </p>
              <Button variant="link" onClick={() => navigate("/")} className="mt-2 text-ciaf-blue">
                Solicitar un turno
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate("/simulador")} className="text-ciaf-blue">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al simulador
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default FinanciacionPage;