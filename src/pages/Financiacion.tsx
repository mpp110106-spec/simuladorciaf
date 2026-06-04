import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, MessageSquareHeart } from "lucide-react";
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
            className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-ciaf-blue via-ciaf-blue to-ciaf-light-blue p-8 sm:p-10 text-white shadow-2xl transition-all hover:shadow-[0_30px_70px_-15px_hsl(var(--ciaf-blue)/0.55)] hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ciaf-gold focus-visible:ring-offset-2"
          >
            {/* Decorative brand accents */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-ciaf-light-blue/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-ciaf-gold/20 blur-3xl" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ciaf-gold to-transparent opacity-70" />
            </div>

            <div className="relative flex flex-col items-center text-center gap-5">
              <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm shadow-lg">
                <MessageSquareHeart className="h-8 w-8" />
              </div>
              <div>
                <p className="inline-block rounded-full bg-ciaf-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ciaf-blue">
                  Área de Cartera CIAF
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight mt-3">
                  ¡Tu opinión es el primer paso!
                </h1>
              </div>
              <p className="text-sm leading-relaxed text-white/85 max-w-md">
                En CIAF creemos que cada experiencia cuenta. Hoy queremos escucharte de verdad: cómo fue tu experiencia con el equipo de Cartera, qué hicimos bien y en qué podemos mejorar.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ciaf-blue shadow-lg transition-transform group-hover:scale-105">
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