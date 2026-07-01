import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoCiaf from "@/assets/logo-ciaf-azul.png";

const FinanciacionPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Financiación | CIAF</title>
        <meta name="description" content="Continúa tu proceso de financiación con CIAF." />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/30 via-background to-background py-10 px-4 flex items-center">
        <div className="max-w-xl mx-auto w-full">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-14 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-ciaf-blue mt-4">Gracias</h1>
            <p className="text-muted-foreground mt-2">Un asesor continuará tu proceso de financiación.</p>
          </header>

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