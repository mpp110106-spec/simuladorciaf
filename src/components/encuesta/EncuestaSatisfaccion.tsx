import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { encuestaService } from "@/services/adminService";

interface Props {
  open: boolean;
  turnoId: string;
  asesora?: string | null;
  onClose: () => void;
}

const EncuestaSatisfaccion = ({ open, turnoId, asesora, onClose }: Props) => {
  const [rating, setRating] = useState(0);
  const [atencion, setAtencion] = useState([8]);
  const [tiempo, setTiempo] = useState([8]);
  const [financiero, setFinanciero] = useState([8]);
  const [recomendaria, setRecomendaria] = useState([9]);
  const [resolvio, setResolvio] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (rating === 0) { toast.error("Selecciona una calificación general"); return; }
    setSending(true);
    try {
      await encuestaService.create({
        turno_id: turnoId,
        rating,
        atencion_score: atencion[0],
        tiempo_espera_score: tiempo[0],
        proceso_financiero_score: financiero[0],
        recomendaria_score: recomendaria[0],
        resolvio_dudas: resolvio ?? undefined,
        comentario: comentario.trim() || undefined,
      });
      encuestaService.marcarEnviada(turnoId);
      setDone(true);
      setTimeout(onClose, 2200);
    } catch (e) {
      toast.error("No pudimos enviar tu encuesta", { description: e instanceof Error ? e.message : "" });
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-gradient-to-br from-white via-white to-ciaf-blue-light/30">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="p-10 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-ciaf-blue">¡Gracias por tu opinión!</h3>
              <p className="text-sm text-muted-foreground">Tu retroalimentación nos ayuda a mejorar.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ciaf-blue/70 font-semibold">Encuesta de satisfacción</p>
                  <h2 className="text-xl font-bold text-ciaf-blue">¿Cómo fue tu experiencia?</h2>
                  {asesora && <p className="text-xs text-muted-foreground mt-0.5">Atendido por {asesora}</p>}
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Calificación general</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110">
                      <Star className={`w-9 h-9 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: "Atención recibida", v: atencion, set: setAtencion },
                { label: "Tiempos de espera", v: tiempo, set: setTiempo },
                { label: "Proceso financiero", v: financiero, set: setFinanciero },
                { label: "¿Recomendarías el servicio?", v: recomendaria, set: setRecomendaria },
              ].map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="font-bold text-ciaf-blue tabular-nums">{s.v[0]}/10</span>
                  </div>
                  <Slider min={1} max={10} step={1} value={s.v} onValueChange={s.set} />
                </div>
              ))}

              <div className="space-y-1.5">
                <p className="text-sm font-medium">¿La asesora resolvió tus dudas?</p>
                <div className="flex gap-2">
                  {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map((o) => (
                    <button key={o.l} type="button" onClick={() => setResolvio(o.v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                        resolvio === o.v ? "bg-ciaf-blue text-white border-ciaf-blue" : "bg-white border-slate-200 hover:border-ciaf-blue/50"
                      }`}>{o.l}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Comentario (opcional)</p>
                <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3}
                  placeholder="Cuéntanos cómo fue tu experiencia..." />
              </div>

              <Button onClick={submit} disabled={sending} className="w-full bg-ciaf-blue hover:bg-ciaf-blue/90 text-white">
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar encuesta
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EncuestaSatisfaccion;