import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, FileSignature, ExternalLink, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import FinanciacionTimeline from "@/components/financiacion/FinanciacionTimeline";
import MiTurnoCard from "@/components/turnos/MiTurnoCard";
import { useActiveTurno } from "@/hooks/useActiveTurno";
import { useFlow } from "@/stores/flowStore";
import logoCiaf from "@/assets/logo-ciaf-azul.png";

const FORMULARIO_CREDITO_URL = "https://ciaf.digital/inscribete/";
const ENCUESTA_CARTERA_URL = "https://docs.google.com/forms/d/e/1FAIpQLScjPPacKUjmN_C8JJPPoCk6JSAwG8D_foqW6YCuzvdWV6PiqA/viewform";

const FinanciacionPage = () => {
  const navigate = useNavigate();
  const [id, setId] = useState<string | null>(null);
  const { turno } = useActiveTurno();
  const { state } = useFlow();
  const esPresencial = state.modalidad === "sede";

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

          {turno?.id && (
            <div className="mb-6">
              <MiTurnoCard turnoId={turno.id} />
            </div>
          )}

          {esPresencial && (
            <a
              href={ENCUESTA_CARTERA_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir encuesta de satisfacción del Área de Cartera CIAF en una nueva pestaña (Google Forms, 2 minutos)"
              className="group mb-6 block overflow-hidden rounded-2xl border border-ciaf-gold/40 bg-gradient-to-br from-[#CCC399] via-[#d9d1ad] to-[#CCC399] p-5 text-ciaf-blue shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ciaf-blue focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-4">
                <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ciaf-blue text-white ring-1 ring-ciaf-blue/30">
                  <Star className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    Área de Cartera CIAF
                  </p>
                  <p className="text-base font-bold leading-tight">
                    ¡Tu opinión es el primer paso!
                  </p>
                  <p className="text-xs leading-relaxed mt-2 text-ciaf-blue/85">
                    En CIAF creemos que cada experiencia cuenta. Cada conversación, cada duda y cada proceso hace parte de tu camino… y también del nuestro.
                  </p>
                  <p className="text-xs leading-relaxed mt-2 text-ciaf-blue/85">
                    Hoy queremos escucharte de verdad: cómo fue tu experiencia con el equipo de Cartera, qué hicimos bien y en qué podemos mejorar. Tu opinión se convierte en acciones para acompañarte mejor.
                  </p>
                  <p className="text-xs font-semibold mt-3 inline-flex items-center gap-1.5 underline underline-offset-2">
                    Cuéntanos aquí (te toma 2 minutos)
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <span className="sr-only">(se abre en una nueva pestaña)</span>
                  </p>
                </div>
              </div>
            </a>
          )}

          {/* CTA: Formulario oficial de crédito */}
          <a
            href={FORMULARIO_CREDITO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-6 block overflow-hidden rounded-2xl border border-ciaf-blue/20 bg-gradient-to-br from-ciaf-blue to-ciaf-light-blue p-5 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  Paso requerido
                </p>
                <p className="text-base font-semibold leading-tight">
                  Completa el formulario oficial de crédito
                </p>
                <p className="text-xs opacity-90 mt-0.5">
                  Diligéncialo para iniciar tu estudio en CIAF Digital.
                </p>
              </div>
              <ExternalLink className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </a>

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