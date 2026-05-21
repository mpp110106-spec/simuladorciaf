import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Turno } from "@/types/turno";

interface Props {
  turno: Turno | null;
  onClose: () => void;
  onConfirm: (obs: string) => Promise<void>;
}

export default function FinishModal({ turno, onClose, onConfirm }: Props) {
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState("—");

  useEffect(() => {
    if (!turno) return;
    setObs("");
    const inicio = (turno as Turno & { atencion_inicio?: string }).atencion_inicio;
    const tick = () => {
      const start = inicio ? new Date(inicio).getTime() : Date.now();
      const mins = Math.max(0, Math.floor((Date.now() - start) / 60000));
      setElapsed(`${mins} min`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [turno]);

  const handle = async () => {
    if (!turno) return;
    setLoading(true);
    try { await onConfirm(obs); onClose(); } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!turno} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#001550]">Finalizar atención</DialogTitle>
        </DialogHeader>
        {turno && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border p-3">
              <div className="text-sm font-semibold text-slate-800">
                Turno #{String(turno.numero).padStart(3, "0")} · {turno.nombre}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Clock className="w-3.5 h-3.5" /> Duración: {elapsed}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Observaciones (opcional)</label>
              <Textarea
                rows={3}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Resumen de la atención, próximos pasos, acuerdos..."
                className="mt-1"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handle} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? "Guardando..." : "Confirmar finalización"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}