import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  CreditCard,
  MessageCircle,
  Mail,
  ExternalLink,
  QrCode,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoCiaf from "@/assets/logo-ciaf-azul.png";
import qrDaviplata from "@/assets/qr-daviplata-ciaf.png";

const FinanciacionPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Financiación | CIAF</title>
        <meta
          name="description"
          content="Continúa tu proceso de financiación con CIAF. Medios de pago, contacto y formulario de crédito."
        />
      </Helmet>
      <main className="min-h-screen bg-gradient-to-b from-ciaf-blue-light/30 via-background to-background py-10 px-4">
        <div className="max-w-xl mx-auto w-full">
          <header className="text-center mb-8">
            <img src={logoCiaf} alt="CIAF" className="h-14 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-ciaf-blue mt-4">
              ¡Estás a un paso!
            </h1>
            <p className="text-muted-foreground mt-2">
              Completa tu pago y envía tu solicitud de crédito para finalizar el proceso.
            </p>
          </header>

          {/* 1. Medios de Pago */}
          <section className="bg-white rounded-2xl p-6 shadow-card mb-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ciaf-blue/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-ciaf-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ciaf-blue">
                  Medios de Pago
                </h2>
                <p className="text-sm text-muted-foreground">
                  Realiza tu pago de forma rápida y segura
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-muted/30 rounded-xl p-4">
              <div className="shrink-0">
                <img
                  src={qrDaviplata}
                  alt="QR Daviplata CIAF"
                  className="w-36 h-36 rounded-lg border border-border object-contain bg-white"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-ciaf-blue" />
                  <span className="text-sm font-medium text-ciaf-blue">
                    Escanea el código QR
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  O utiliza nuestra llave Daviplata:
                </p>
                <div className="inline-flex items-center gap-2 bg-ciaf-blue text-white px-4 py-2 rounded-lg font-mono text-sm font-semibold">
                  @daviciaf
                </div>
              </div>
            </div>
          </section>

          {/* 2 & 3. Contacto */}
          <section className="bg-white rounded-2xl p-6 shadow-card mb-6 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ciaf-blue/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-ciaf-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ciaf-blue">
                  ¿Dudas con tu pago?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Escríbenos y te ayudamos de inmediato
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://wa.me/573126814341"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-border/60 hover:border-ciaf-blue/40 hover:bg-ciaf-blue/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    WhatsApp
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    312 681 4341
                  </p>
                </div>
              </a>

              <a
                href="mailto:pagos@ciaf.edu.co"
                className="flex items-center gap-3 p-4 rounded-xl border border-border/60 hover:border-ciaf-blue/40 hover:bg-ciaf-blue/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-ciaf-blue/5 flex items-center justify-center shrink-0 group-hover:bg-ciaf-blue/10 transition-colors">
                  <Mail className="w-5 h-5 text-ciaf-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Correo de pagos
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    pagos@ciaf.edu.co
                  </p>
                </div>
              </a>
            </div>
          </section>

          {/* 4. Formulario de Crédito */}
          <section className="bg-gradient-to-br from-ciaf-blue to-ciaf-blue-hover rounded-2xl p-6 shadow-lg mb-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">
                  Completa tu solicitud de crédito
                </h2>
                <p className="text-sm text-white/80 mb-4 leading-relaxed">
                  Para finalizar tu proceso de financiación, debes diligenciar el formulario oficial de CIAF.
                </p>
                <a
                  href="https://ciaf.digital/inscribete/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-ciaf-blue px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors shadow-sm"
                >
                  Ir al formulario de crédito
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50 shrink-0 hidden sm:block" />
            </div>
          </section>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/simulador")}
              className="text-ciaf-blue"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al simulador
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default FinanciacionPage;
