import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoCiaf from "@/assets/logo-ciaf-azul.png";

const ENCUESTA_CARTERA_URL = "https://docs.google.com/forms/d/e/1FAIpQLScjPPacKUjmN_C8JJPPoCk6JSAwG8D_foqW6YCuzvdWV6PiqA/viewform";

const FinanciacionPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Encuesta Área de Cartera | CIAF</title>
        <meta name="description" content="Comparte tu experiencia con el Área de Cartera de CIAF. Te toma 2 minutos." />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/30 via-background to-background py-10 px-4 flex items-center">
        <div className="max-w-xl mx-auto w-full">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-14 mx-auto mb-3" />
          </header>

          <a
            href={ENCUESTA_CARTERA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir encuesta de satisfacción del Área de Cartera CIAF en una nueva pestaña (Google Forms, 2 minutos)"
            className="group block overflow-hidden rounded-3xl border-2 border-ciaf-gold/50 bg-gradient-to-br from-[#CCC399] via-[#d9d1ad] to-[#CCC399] p-8 text-ciaf-blue shadow-2xl transition-all hover:shadow-[0_25px_60px_-15px_hsl(var(--ciaf-blue)/0.4)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ciaf-blue focus-visible:ring-offset-2"
          >
            <div className="flex flex-col items-center text-center gap-5">
              <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ciaf-blue text-white ring-2 ring-ciaf-blue/30 shadow-lg">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Área de Cartera CIAF
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight mt-2">
                  ¡Tu opinión es el primer paso!
                </h1>
              </div>
              <p className="text-sm leading-relaxed text-ciaf-blue/85">
                En CIAF creemos que cada experiencia cuenta. Hoy queremos escucharte de verdad: cómo fue tu experiencia con el equipo de Cartera, qué hicimos bien y en qué podemos mejorar.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-ciaf-blue px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform group-hover:scale-105">
                Cuéntanos aquí (te toma 2 minutos)
                <ExternalLink aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="sr-only">(se abre en una nueva pestaña)</span>
              </span>
            </div>
          </a>

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