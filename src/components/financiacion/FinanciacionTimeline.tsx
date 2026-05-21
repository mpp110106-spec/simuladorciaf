import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, FileSignature, FileWarning, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financiacionesService } from "@/services/financiacionesService";
import { FINANCIACION_ESTADOS, FINANCIACION_LABEL, type Financiacion, type FinanciacionEstado } from "@/types/financiacion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<FinanciacionEstado, React.ComponentType<{ className?: string }>> = {
  pendiente: Clock,
  en_revision: Loader2,
  req_documentos: FileWarning,
  aprobado: ShieldCheck,
  en_firma: FileSignature,
  finalizado: CheckCircle2,
  rechazado: XCircle,
};

interface Props {
  financiacionId: string;
}

export const FinanciacionTimeline = ({ financiacionId }: Props) => {
  const [fin, setFin] = useState<Financiacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    financiacionesService.getById(financiacionId).then((d) => {
      if (!active) return;
      setFin(d);
      setLoading(false);
    });

    const channel = supabase
      .channel(`fin-${financiacionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "financiaciones", filter: `id=eq.${financiacionId}` },
        (payload) => setFin(payload.new as Financiacion)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [financiacionId]);

  if (loading) {
    return (
      <Card className="border-ciaf-blue/20">
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Cargando estado de tu financiación…
        </CardContent>
      </Card>
    );
  }

  if (!fin) return null;

  const isRechazado = fin.estado === "rechazado";
  const currentIdx = isRechazado ? -1 : FINANCIACION_ESTADOS.indexOf(fin.estado);

  return (
    <Card className="border-ciaf-blue/20 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-ciaf-blue/5 to-ciaf-light-blue/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-ciaf-blue">Estudio de crédito</CardTitle>
            <CardDescription>Seguimiento en tiempo real del estado de tu financiación.</CardDescription>
          </div>
          <Badge className={cn(
            "border",
            isRechazado
              ? "bg-rose-100 text-rose-800 border-rose-200"
              : fin.estado === "finalizado"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-ciaf-blue-light text-ciaf-blue border-ciaf-blue/30",
          )}>
            {FINANCIACION_LABEL[fin.estado]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isRechazado ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-rose-900">Tu solicitud no fue aprobada</p>
              <p className="text-rose-700 mt-1">
                {fin.observaciones || "Un asesor CIAF te contactará para revisar alternativas."}
              </p>
            </div>
          </div>
        ) : (
          <ol className="relative space-y-5">
            {FINANCIACION_ESTADOS.map((estado, idx) => {
              const Icon = STEP_ICONS[estado];
              const done = idx < currentIdx;
              const active = idx === currentIdx;
              return (
                <li key={estado} className="flex items-start gap-3">
                  <div className="relative">
                    <motion.div
                      initial={false}
                      animate={{ scale: active ? 1.05 : 1 }}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                        done && "bg-emerald-500 border-emerald-500 text-white",
                        active && "bg-ciaf-blue border-ciaf-blue text-white shadow-lg shadow-ciaf-blue/30",
                        !done && !active && "bg-muted border-muted-foreground/20 text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : active && estado === "en_revision" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </motion.div>
                    {idx < FINANCIACION_ESTADOS.length - 1 && (
                      <span className={cn(
                        "absolute left-1/2 top-9 -translate-x-1/2 w-0.5 h-6",
                        done ? "bg-emerald-500" : "bg-muted-foreground/20",
                      )} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={cn(
                      "text-sm font-medium",
                      active ? "text-ciaf-blue" : done ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {FINANCIACION_LABEL[estado]}
                    </p>
                    {active && fin.observaciones && (
                      <p className="text-xs text-muted-foreground mt-1">{fin.observaciones}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {fin.firmado && fin.firma_fecha && (
          <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Pagaré firmado el {new Date(fin.firma_fecha).toLocaleDateString("es-CO")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinanciacionTimeline;